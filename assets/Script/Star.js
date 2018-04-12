//格子

cc.Class({
    extends: cc.Component,

    properties: {
        sprite: {
            default: [],
            type: cc.SpriteFrame,
        },

        pos: {
            default: new cc.Vec2()
        },

        number: 0,
        sfIndex: 0,
    },

    onLoad () {
        this.initSpriteFrame();
    },

    initSpriteFrame:function () {
        function getRandomInt(min, max) {
            let ratio = Math.random();
            return min + Math.floor((max - min)*ratio);
        }

        this.sfIndex = getRandomInt(0, this.number);
        let spriteframe = this.getComponent(cc.Sprite);
        spriteframe.spriteFrame = this.sprite[this.sfIndex];
    }
});
