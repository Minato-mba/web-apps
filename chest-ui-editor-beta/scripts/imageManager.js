const imageManager = {
    images: {},

    init: function () {
        this.loadImageData();
    },

    loadImageData: function () {
        const storedImages = util.loadFromLocalStorage('imageManagerData');
        if (storedImages) {
            this.images = storedImages;
        }
    },

    saveImageData: function () {
        util.saveToLocalStorage('imageManagerData', this.images);
    },

    storeImage: function (file, callback, forcePath = null) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageName = forcePath ? forcePath.replace('user_uploaded:', '') : file.name;
            const path = forcePath || ('user_uploaded:' + imageName);

                        this.images[path] = e.target.result;
            this.saveImageData();

            if (callback) {
                callback(path);
            }
        };
        reader.readAsDataURL(file);
    },

    getImageUrl: function (path) {
        return this.images[path] || null;
    },

    isUploadedImage: function (path) {
        return path && path.startsWith('user_uploaded:') && !!this.images[path];
    },

    deleteImage: function (path) {
        if (this.images[path]) {
            delete this.images[path];
            this.saveImageData();
        }
    }
};

imageManager.init();