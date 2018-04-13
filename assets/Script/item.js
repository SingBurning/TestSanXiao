

cc.Class({
    extends: cc.Component,

    properties: {
        label:{
            default: null,
            type: cc.Label,
        },

    },


    // onLoad () {},

    start () {

    },

    onClick:function () {
        this.label.string = this.node.getComponent(cc.Label).string;
    }
    // update (dt) {},
});
