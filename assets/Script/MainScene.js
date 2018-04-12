//GameScene

cc.Class({
    extends: cc.Component,

    properties: {
        Col: 0,
        Row: 0,
        Padding: 0,
        SpacingX: 0,
        SpacingY: 0,

        star: {
            default: null,
            type: cc.Prefab,
        },

        Score:{
            default: null,
            type: cc.Node,
        },

    },

    reward: 0,
    beginX: 0,
    beginY: 0,
    pSet: null,
    stars: null,
    mask: null,

    onLoad () {
        this.buildCoordinateSet();
        this.init();
        this.touch();
    },

    start () {
        this.check();
    },

    // update (dt) {},

    init:function () {
        this.mask = [];
        this.stars = [];
        for (let i = 0; i < this.Row; i++) {
            let arr1 = [];
            let marr = [];
            for (let j = 0; j < this.Col; j++) {
                let ele = cc.instantiate(this.star);
                ele.setPosition(this.pSet[i][j].x, this.pSet[i][j].y);
                this.node.addChild(ele,0,"ele");

                let com = ele.getComponent("Star");
                com.pos = cc.v2(i,j)
                arr1.push(ele);
                marr.push(0);
            }

            this.mask.push(marr);
            this.stars.push(arr1);
        }
    },

    //遍历所有格子位置保存到数组
    buildCoordinateSet:function () {
        let ele = cc.instantiate(this.star);
        let eleSize = ele.getContentSize();
        this.eleSize = eleSize;
        //界面宽度 - （每个格子宽度*（列数-1）)  得出第一个格子的大小， 除以2算出第一个格子的位置
        this.beginX = (this.node.width - (this.SpacingX + eleSize.width) * (this.Row - 1)) / 2
        this.beginY = (eleSize.height / 2) + this.Padding;
        this.pSet = [];
        for (let i = 0; i < this.Row; i++) {
            let arr = [];
            for (let j = 0; j < this.Col + 1; j++) {
                let position = cc.v2(this.beginX + i*(eleSize.width + this.SpacingX), this.beginY + j*(eleSize.height + this.SpacingY));
                arr.push(position);
            }
            //将每列生成的格子位置放入数组
            this.pSet.push(arr);
        }
    },

    //转换坐标为矩阵坐标  将屏幕分割为矩阵格子 根据点击屏幕的坐标计算其相应的矩阵坐标
    positionToPos:function (x,y) {
        let Xx = Math.floor((x - this.beginX) / (this.eleSize.width + this.SpacingX) + 0.5);
        let Yy = Math.floor((y - this.beginY) / (this.eleSize.height + this.SpacingY) + 0.5);
        let pos = cc.v2(Xx, Yy);
        return pos;
    },

    //touch 事件
    touch:function () {
        this.node.on("touchstart", function (event) {
            let p = this.node.convertToNodeSpace(event.getLocation());
            this.p1 = this.positionToPos(p.x, p.y);
            if (this.p1.x < 0 || this.p1.x > this.Row - 1 || this.p1.y < 0 || this.p1.y > this.Col - 1) {
                return
            }

            this.cell1 = this.stars[this.p1.x][this.p1.y];
            this.cur = this.pSet[this.p1.x][this.p1.y];
            this.cell1.select = true;
            this.cell1.zIndex = 1;
        },this);

        this.node.on("touchmove", function (event) {
            if (this.cell1.select) {
                let x = event.getLocationX();
                let y = event.getLocationY();
                if (x >= (this.cur.x - this.eleSize.width - this.SpacingX) && x <= (this.cur.x + this.eleSize.width + this.SpacingX)
             && y <= (this.cur.y + this.eleSize.height + this.SpacingY) && y >= (this.cur.y - this.eleSize.height - this.SpacingY)) 
                {
                    this.cell1.setPosition(x,y);
                }
            }
        },this);

        this.node.on("touchend", function (event) {
            let p = this.node.convertToNodeSpace(event.getLocation());
            this.p2 = this.positionToPos(p.x, p.y);
            if (this.p2.x < 0 || this.p2.x > this.Row - 1 || this.p2.y < 0 || this.p2.y > this.Col - 1) {
                this.cell1.setPosition(this.cur);
                return
            }

            this.cell1.select = false;
            this.cell1.zIndex = 0;
            this.cell2 = this.stars[this.p2.x][this.p2.y]
            if (this.isAround(this.p1, this.p2) && typeof(this.stars[this.p2.x][this.p2.y]) != "undefined") {
                this.changeTwoPos(this.p1, this.p2);
                if (this.checkConnected()) {
                    this.delAndDrop();
                }else{
                    this.changeTwoPos(this.p2, this.p1);
                }
            }else{
                this.cell1.setPosition(this.cur);
            }
        },this)
    },

    check:function () {
        if (this.checkConnected()) {
            this.delAndDrop();
        }  
    },

    //判断是否相邻
    isAround:function (p1,p2) {
        let dis = Math.abs((p2.x - p1.x) + (p2.y - p1.y));
        if (dis == 1) {
            return true;
        }
        return false;
    },

    //交换两个格子位置, 包括存储的位置信息 和 实例的交换
    changeTwoPos:function (p1,p2) {
        this.stars[p1.x][p1.y].getComponent("Star").pos = p2;
        this.stars[p1.x][p1.y].setPosition(this.pSet[p2.x][p2.y]);
        this.stars[p2.x][p2.y].getComponent("Star").pos = p1;
        this.stars[p2.x][p2.y].setPosition(this.pSet[p1.x][p1.y]);

        let t = this.stars[p1.x][p1.y];
        this.stars[p1.x][p1.y] = this.stars[p2.x][p2.y];
        this.stars[p2.x][p2.y] = t;
    },

    delAndDrop:function () {
        this.deleteConnected();
        this.dropAndUpdate();
    },

    //删除相连的格子
    deleteConnected:function () {
        for (let i = 0; i < this.Row; i++) {
            let count = 0;
            let start = 0, end;
            let onoff = true;
            for (let j = this.Col - 1; j > 0; j--) {
                if (this.mask[i][j] == 1) {
                    if (onoff) {
                        start = j;
                        onoff = false;
                    }
                    let ele = cc.instantiate(this.star);
                    ele.setPosition(this.pSet[i][this.Col].x, this.pSet[i][this.Col].y);
                    this.node.addChild(ele, 0, "ele");
                    this.stars[i].push(ele);
                    let act = cc.sequence(cc.blink(0.3, 2), cc.scaleBy(0.5, 0, 0));
                    this.stars[i][j].runAction(act);
                }

                if ((this.mask[i][j - 1] != 1 || j - 1 < 0) && onoff == false) {
                    end = j;
                    this.stars[i].splice(end, start - end + 1);
                    onoff = true;
                }
                this.mask[i][j] = 0;
            }
        }
        //删除相连的格子后，更新分数
    },

    //下落动画 更新位置
    dropAndUpdate:function () {
        let finished = cc.callFunc(function (target) {
            this.check();
        }, this);

        for (let i = 0; i < this.stars.length; i++) {
            for (let j = 0; j < this.stars[i].length; j++) {
                if (i == this.stars.length - 1 && j == this.stars[i].length - 1) {
                    let act = cc.sequence(cc.moveTo(1, this.pSet[i][j]), finished);
                }else{
                    let act = cc.moveTo(1, this.pSet[i][j]);
                }
                this.stars[i][j].runAction(act);
                let com = this.stars[i][j].getComponent("Star");
                com.pos = cc.v2(i,j);
            }
        }
    },

    checkConnected:function () {
        let count1 = this.verticalCheckConnected();
        let count2 = this.horizontalCheckConnected();

        this.reward = this.calScore(count1 + count2);
        return ((count1 + count2) > 0)?true:false;
    },

    calScore:function (num) {
        return num*10;
    },

    //检查纵向相连情况
    verticalCheckConnected:function () {
        let index1, index2;
        let start, end;
        let count = 0;  //保存需要删除的格子数
        for (let i = 0; i < this.stars.length; i++) {
            if (typeof(this.stars[i][0]) == "undefined") {
                continue;
            }

            index1 = this.stars[i][0].getComponent("Star").sfIndex;
            start = 0;
            for (let j = 1; j < this.stars[i].length; j++) {
                if (j == this.stars[i].length) {
                    index2 = -1;
                }else{
                    index2 = this.stars[i][j].getComponent("Star").sfIndex;
                }

                if (index1 != index2) {
                    end = j;
                    if (end - start >= 3) {
                        while (start != end) {
                            this.mask[i][start] = 1;
                            start++;
                            count++;
                        }
                    }
                    start = end;
                    if (start != this.stars[i].length) {
                        index1 = this.stars[i][start].getComponent("Star").sfIndex;
                    }
                }
            }
        }
        return count;
    },

    horizontalCheckConnected:function () {
        
    },
});
