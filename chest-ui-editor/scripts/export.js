const exporter = {

    extractTexturePaths: function (json) {
        const texturePaths = new Set();


        const findTextures = (obj) => {
            if (!obj || typeof obj !== 'object') return;


            if (obj.texture && typeof obj.texture === 'string' && !obj.texture.startsWith('$')) {
                texturePaths.add(obj.texture);
            }


            if (obj.$texture && typeof obj.$texture === 'string' && !obj.$texture.startsWith('$')) {
                texturePaths.add(obj.$texture);
            }


            if (obj.$path_to_image && typeof obj.$path_to_image === 'string' && !obj.$path_to_image.startsWith('$')) {
                texturePaths.add(obj.$path_to_image);
            }


            if (Array.isArray(obj)) {
                obj.forEach(item => findTextures(item));
            } else {
                for (let key in obj) {
                    findTextures(obj[key]);
                }
            }
        };

        findTextures(json);
        return texturePaths;
    },
    generatePlaceholderTexture: function (path) {
        return new Promise(async (resolve) => {
            try {
                const response = await fetch(`../assets/${path.replace('textures', 'images')}.png`);
                console.log(path);


                if (response.ok) {
                    const blob = await response.blob();
                    console.log(`Successfully loaded texture from ${path}`);
                    resolve({
                        blob: blob,
                        isPlaceholder: false
                    });
                    return;
                }
            } catch (error) {
                console.log(`Failed to load texture from ${path}, generating placeholder instead}`);
            }

            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');


            const filename = path.split('/').pop();


            const hash = path.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);

            const hue = Math.abs(hash) % 360;


            ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
            ctx.fillRect(0, 0, 64, 64);


            ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`;
            ctx.lineWidth = 1;


            for (let i = 8; i < 64; i += 8) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(64, i);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 64);
                ctx.stroke();
            }


            ctx.strokeStyle = `hsl(${hue}, 70%, 30%)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 64, 64);


            ctx.fillStyle = `hsl(${hue}, 70%, 20%)`;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(filename, 32, 32);


            canvas.toBlob(blob => {
                resolve({
                    blob: blob,
                    isPlaceholder: true
                });
            });
        });
    },
    createResourcePackZip: async function (json) {
        const zip = new JSZip();


        const resourcePack = zip.folder("ChestUI_ResourcePack");

        const jsonForExport = JSON.parse(JSON.stringify(json));

        const texturePaths = this.extractTexturePaths(jsonForExport);
        console.log("Extracted texture paths:", texturePaths);

        for (const path of [...texturePaths]) {
            if (path.startsWith('user_uploaded:')) {
                if (imageManager.uploadedImages[path]) {
                    const imageData = imageManager.uploadedImages[path].data;
                    const imageName = path.replace('user_uploaded:', '');
                    const actualTexturePath = `textures/ui/custom/${imageName}`;

                    const textureFolder = resourcePack.folder('textures/ui/custom');

                    const base64Data = imageData.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteArrays = [];

                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArrays.push(byteCharacters.charCodeAt(i));
                    }

                    const blob = new Uint8Array(byteArrays);

                    textureFolder.file(`${imageName}.png`, blob);

                    this.updateImagePath(jsonForExport, path, actualTexturePath);
                }
            }
            else if (path.startsWith('textures/ui/custom/custom_')) {
                const userUploadedPath = 'user_uploaded:' + path.replace('textures/ui/custom/', '');
                if (imageManager.uploadedImages[userUploadedPath]) {
                    console.log('Skipping manually entered path that matches uploaded image:', path);
                    continue;
                }
            }
        }

        resourcePack.file("ui/chest_screen.json", JSON.stringify(jsonForExport, null, 2));

        for (const path of texturePaths) {
            if (!path.startsWith('user_uploaded:') && path.startsWith('textures/')) {
                if (path.startsWith('textures/ui/custom/custom_')) {
                    const userUploadedPath = 'user_uploaded:' + path.replace('textures/ui/custom/', '');
                    if (imageManager.uploadedImages[userUploadedPath]) {
                        console.log('Skipping duplicate custom texture path:', path);
                        continue;
                    }
                }

                const textureResult = await this.generatePlaceholderTexture(path);

                const pathParts = path.split('/');
                const filename = pathParts.pop();
                let currentPath = resourcePack;

                for (const part of pathParts) {
                    currentPath = currentPath.folder(part);
                }

                if (textureResult.isPlaceholder) {
                    console.log(`Adding placeholder texture for ${path}`);
                    currentPath.file(`${filename}.png`, textureResult.blob);
                } else {
                    console.log(`Adding fetched texture for ${path}`);
                    currentPath.file(`${filename}.png`, textureResult.blob);
                }
            }
        }


        return zip.generateAsync({ type: "blob" });
    },
    updateImagePath: function (json, oldPath, newPath) {
        const updatePath = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.texture === oldPath) {
                obj.texture = newPath;
            }

            if (obj.$texture === oldPath) {
                obj.$texture = newPath;
            }

            if (obj.$path_to_image === oldPath) {
                obj.$path_to_image = newPath;
            }

            if (Array.isArray(obj)) {
                obj.forEach(item => updatePath(item));
            } else {
                for (let key in obj) {
                    updatePath(obj[key]);
                }
            }
        };

        updatePath(json);
    },
    generateUUID: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    exportProject: async function () {
        try {

            const exportButton = document.getElementById('export-json');
            const originalText = exportButton.innerHTML;
            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="button-text">Processing...</span>';
            exportButton.disabled = true;


            const json = preview.generateJSON();


            const zipBlob = await this.createResourcePackZip(json);


            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipBlob);
            a.download = "ChestUI_ResourcePack.zip";
            document.body.appendChild(a);
            a.click();


            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                exportButton.innerHTML = originalText;
                exportButton.disabled = false;
            }, 100);

        } catch (error) {
            console.error("Error exporting project:", error);
            alert("Error creating resource pack: " + error.message);


            document.getElementById('export-json').innerHTML = '<i class="fas fa-file-export"></i><span class="button-text">Export</span>';
            document.getElementById('export-json').disabled = false;
        }
    }
};
