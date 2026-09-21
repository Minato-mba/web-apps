const imageManager = {
    uploadedImages: {},

    generateImageName: function (filename) {
        const baseName = String(filename || 'image').replace(/\.[^/.]+$/, '');
        const sanitizedName = baseName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        return `custom_${sanitizedName}_${uniqueId}`;
    },

    storeImage: function (file, callback, forcePath = null) {
        const reader = new FileReader();
        reader.onerror = () => {
            console.error('Could not read uploaded image:', file?.name);
            if (callback) callback(null);
        };
        reader.onload = event => {
            const forcedName = forcePath
                ? String(forcePath).replace(/^user_uploaded:/, '').replace(/\.[^/.]+$/, '')
                : null;
            const imageName = forcedName || this.generateImageName(file.name);
            const imagePath = `user_uploaded:${imageName}`;
            this.uploadedImages[imagePath] = {
                data: event.target.result,
                type: file.type,
                originalName: file.name
            };
            if (callback) callback(imagePath);
        };
        reader.readAsDataURL(file);
    },

    getImageUrl: function (path) {
        if (!path || typeof path !== 'string') return '';
        if (path.startsWith('user_uploaded:')) {
            return this.uploadedImages[path]?.data || '';
        }
        if (path.startsWith('textures/ui/')) {
            const filename = path.replace('textures/ui/', '');
            return `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/${filename}.png`;
        }
        return `../assets/${path.replace('textures', 'images')}.png`;
    },

    isUploadedImage: function (path) {
        return typeof path === 'string' && path.startsWith('user_uploaded:');
    },

    deleteImage: function (path) {
        delete this.uploadedImages[path];
    }
};
