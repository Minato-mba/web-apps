const Storage = {
    initialize: function () {

        if (!localStorage.getItem('playerHeadPacks')) {
            localStorage.setItem('playerHeadPacks', JSON.stringify({}));
        }
    },

    getAllPacks: function () {
        return JSON.parse(localStorage.getItem('playerHeadPacks') || '{}');
    },

    getPack: function (packId) {
        const packs = this.getAllPacks();
        return packs[packId] || null;
    },

    createPack: function (packName) {
        const packs = this.getAllPacks();
        const packId = Date.now().toString();

        packs[packId] = {
            id: packId,
            name: packName,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            heads: []
        };

        localStorage.setItem('playerHeadPacks', JSON.stringify(packs));
        return packId;
    },

    savePack: function (pack) {
        const packs = this.getAllPacks();
        pack.lastModified = new Date().toISOString();
        packs[pack.id] = pack;
        localStorage.setItem('playerHeadPacks', JSON.stringify(packs));
    },

    addHead: function (packId, head) {
        const pack = this.getPack(packId);
        console.log(pack, pack?.heads.some(h => h.name === head.name));

        if (!pack) return false;

        const exists = pack.heads.some(h => h.name === head.name);
        if (exists) return false;

        pack.heads.push({
            name: head.name,
            itemTexture: head.itemTexture,
            blockTexture: head.blockTexture,
            added: new Date().toISOString()
        });

        this.savePack(pack);
        return true;
    },

    updateHead: function (packId, headName, updateData) {
        const pack = this.getPack(packId);
        if (!pack) return false;

        const headIndex = pack.heads.findIndex(h => h.name === headName);
        if (headIndex === -1) return false;

        const head = pack.heads[headIndex];
        pack.heads[headIndex] = {
            ...head,
            ...updateData,
            name: head.name
        };

        this.savePack(pack);
        return true;
    },

    removeHead: function (packId, headName) {
        const pack = this.getPack(packId);
        if (!pack) return false;

        const initialLength = pack.heads.length;
        pack.heads = pack.heads.filter(h => h.name !== headName);

        if (pack.heads.length === initialLength) {
            return false;
        }

        this.savePack(pack);
        return true;
    },

    deletePack: function (packId) {
        const packs = this.getAllPacks();
        if (!packs[packId]) return false;

        delete packs[packId];
        localStorage.setItem('playerHeadPacks', JSON.stringify(packs));
        return true;
    },

    exportPack: function (packId) {
        return this.getPack(packId);
    },

    importPack: function (packData) {

        if (!packData || !packData.name || !Array.isArray(packData.heads)) {
            return null;
        }

        const packId = Date.now().toString();
        const packs = this.getAllPacks();

        packs[packId] = {
            ...packData,
            id: packId,
            created: packData.created || new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        localStorage.setItem('playerHeadPacks', JSON.stringify(packs));
        return packId;
    },

    setActivePack: function (packId) {
        localStorage.setItem('activePackId', packId);
    },

    getActivePack: function () {
        return localStorage.getItem('activePackId');
    },

    clearActivePack: function () {
        localStorage.removeItem('activePackId');
    },

    getStorageUsage: function () {
        const packs = this.getAllPacks();
        const packsJson = JSON.stringify(packs);
        const used = new Blob([packsJson]).size;

        const total = 5 * 1024 * 1024;

        return {
            used,
            total,
            percentage: (used / total) * 100
        };
    }
};
