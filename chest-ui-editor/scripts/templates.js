

const templates = {

    init: function () {
        this.setupTemplateListeners();
    },
    setupTemplateListeners: function () {
        const templateItems = document.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', () => {
                const templateName = item.getAttribute('data-template');
                this.loadTemplate(templateName);
            });
        });
    },
    loadTemplate: function (templateName) {
        if (!this.templates[templateName]) {
            console.error(`Template '${templateName}' not found`);
            return;
        }


        editor.clearComponents();


        const templateComponents = this.templates[templateName]();
        templateComponents.forEach(component => {
            editor.addComponent(component);
        });
    },
    templates: {
        
        empty: function () {
            // Return empty array for starting from scratch
            return [];
        },

        vanilla: function () {
            const components = [];


            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 9; col++) {
                    const component = createComponent('container_item', 7 + col * 18, 9 + row * 18);
                    component.properties.collection_index = row * 9 + col;
                    components.push(component);
                }
            }

            return components;
        },


        Cooking_Pot: function () {
            const components = [];


            const label = createComponent('label', 23, -9);
            label.properties.text = "Cooking Pot";
            label.properties.color = [0.25, 0.25, 0.25];
            components.push(label);


            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    const component = createComponent('container_item', 30 + col * 18, 6 + row * 18);
                    component.properties.collection_index = row * 3 + col;
                    components.push(component);
                }
            }


            const on_off = createComponent('on_off_item', 48, 45);
            on_off.properties.collection_index = 6;
            on_off.properties.active = true;
            components.push(on_off);


            const progressBar = createComponent('progress_bar', 90, 16);
            progressBar.properties.collection_index = 7;
            progressBar.properties.value = 5;
            components.push(progressBar);


            const pot = createComponent('pot', 120, 8);
            pot.properties.collection_index = 8;
            components.push(pot);


            const containerType = createComponent('container_type', 90, 45);
            containerType.properties.collection_index = 9;
            containerType.properties.container_type = '2';
            components.push(containerType);


            const output = createComponent('container_item', 120, 45);
            output.properties.collection_index = 10;
            components.push(output);

            return components;
        },


        crafting: function () {
            const components = [];


            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 2; col++) {
                    const component = createComponent('container_item', 30 + col * 20, 24 + row * 20);
                    component.properties.collection_index = row * 2 + col;
                    components.push(component);
                }
            }


            const plus = createComponent('image', 80, 34);
            plus.properties.texture = "textures/ui/dark_plus";
            plus.properties.alpha = 0.5;
            plus.width = 32;
            plus.height = 12;
            components.push(plus);


            const output = createComponent('container_item', 120, 34);
            output.properties.collection_index = 4;
            output.width = 24;
            output.height = 24;
            components.push(output);


            const progressBar = createComponent('progress_bar', 90, 60);
            progressBar.properties.collection_index = 5;
            progressBar.properties.value = 3;
            components.push(progressBar);

            return components;
        },


        altar: function () {
            const components = [];


            const cross = createComponent('image', 36, 13);
            cross.properties.texture = "textures/ui/altar_cross";
            cross.width = 41;
            cross.height = 29;
            components.push(cross);


            const book = createComponent('container_item_with_picture', 30, 6);
            book.properties.collection_index = 0;
            book.properties.picture = "textures/ui/book_ui";
            components.push(book);


            const topRight = createComponent('container_item', 66, 6);
            topRight.properties.collection_index = 1;
            components.push(topRight);


            const shard = createComponent('container_item_with_picture', 48, 42);
            shard.properties.collection_index = 2;
            shard.properties.picture = "textures/ui/shard_ui";
            components.push(shard);


            const progressBar = createComponent('progress_bar', 90, 24);
            progressBar.properties.collection_index = 3;
            progressBar.properties.value = 6;
            components.push(progressBar);


            const output = createComponent('container_item', 124, 20);
            output.properties.collection_index = 4;
            output.width = 26;
            output.height = 26;
            components.push(output);

            return components;
        },


        star_pattern: function () {
            const components = [];


            const center = createComponent('container_item', 60, 30);
            center.properties.collection_index = 0;
            components.push(center);


            const top = createComponent('container_item', 60, 0);
            top.properties.collection_index = 1;
            components.push(top);


            const bottom = createComponent('container_item', 60, 60);
            bottom.properties.collection_index = 2;
            components.push(bottom);


            const left = createComponent('container_item', 30, 30);
            left.properties.collection_index = 3;
            components.push(left);


            const right = createComponent('container_item', 90, 30);
            right.properties.collection_index = 4;
            components.push(right);

            return components;
        }
    }
};
