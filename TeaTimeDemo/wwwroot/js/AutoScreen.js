//AutoScreen.js

$(document).ready(function () {



    AutoScreen_js.adjustScale();
    AutoScreen_js.resetAutoScreenBlockSize();

    window.addEventListener('resize', function () {
        console.log("");
        AutoScreen_js.adjustScale();
        AutoScreen_js.resetAutoScreenBlockSize();
    });


    //window.addEventListener('beforeprint', () => {
    //    AutoScreen_js.resetAutoScreenScale();
    //    AutoScreen_js.resetAutoScreenBlockSize();

    //    }
    //);


    window.addEventListener('afterprint', () => {
        AutoScreen_js.adjustScale();
        AutoScreen_js.resetAutoScreenBlockSize();
        }
    );
    
});


const AutoScreen_js = {
    ZoomValue: 1.5 ,
    RealscaleRatio:1,
    resetAutoScreenScale: () => {
        const autoScreen = document.getElementById('AutoScreen'); 
        autoScreen.style.transform = `scale(1)`;
        //autoScreen.style.zoom = '1';
    },

    SetPrintAutoScreenScale: () => {
        const autoScreen = document.getElementById('AutoScreen');
        autoScreen.style.transform = `scale(${1 / window.devicePixelRatio})`;
        //autoScreen.style.transform = `scale(1)`;
        //autoScreen.style.zoom = '1';
    },

    adjustScale: ()=> {

        // 获取 AutoScreen 元素并应用缩放
        const autoScreen = document.getElementById('AutoScreen');
       

        const dpr = window.devicePixelRatio || 1;
       

        // 获取屏幕宽度，确保正确取值
        const screenWidth = window.screen.availWidth;


        // 设定实际内容宽度（20cm 转为像素）
        const locWidth = autoScreen.offsetWidth;

        // 设定最佳宽度（28cm 转为像素）
        const BestWidth = locWidth * AutoScreen_js.ZoomValue;


        //console.log(`目標: width : ${window.screen.width}        
        //\n availWidth :  ${window.screen.availWidth} 
        //\n innerWidth : ${window.innerWidth * dpr}  
        //\n BestWidth : ${BestWidth}`);

        // 计算目标宽度，考虑到最佳宽度限制
        let targetScreenWidth = Math.min(window.screen.availWidth, window.innerWidth * dpr, BestWidth)  - 20; // 减去出血边距
        //targetScreenWidth = BestWidth - 20;
        //console.log(`目标尺寸: ${targetScreenWidth}`);


        // 计算缩放比例
        const scaleRatio = targetScreenWidth / locWidth;
        AutoScreen_js.RealscaleRatio = scaleRatio;
        console.log(`缩放比例: ${scaleRatio}`);

       
        if (autoScreen) {
            autoScreen.style.transform = `scale(${scaleRatio})`;
            autoScreen.style.transformOrigin = "0 0"; // 确保缩放从左上角开始
        } else {
            console.error("无法找到元素 #AutoScreen");
        }

       
    },  
    resetAutoScreenBlockSize_scale1: () => {


        const autoScreen = document.getElementById('AutoScreen'); 
        const _AutoScreenBlock = document.getElementById('AutoScreenBlock');
  
        //_AutoScreenBlock.style.transform = `scale(${1})`;
        
        if (!_AutoScreenBlock || !autoScreen) {

            console.log(`return`);

            return;
        }

        let { width: autoScreenWidth, height: autoScreenHeight } = autoScreen.getBoundingClientRect();

       

        // 将 autoScreen 的宽度和高度应用到 _AutoScreenBlock
        _AutoScreenBlock.style.width = `${(Math.ceil(autoScreenWidth * 100) / 100 )+ 2}px`;
        _AutoScreenBlock.style.height = `${(Math.ceil(autoScreenHeight * 100) / 100) + 50}px`;


    },
    resetAutoScreenBlockSize: () => {
        const autoScreen = document.getElementById('AutoScreen');
        const _AutoScreenBlock = document.getElementById('AutoScreenBlock');

        if (!_AutoScreenBlock || !autoScreen) {
            console.log(`return`);
            return;
        }

        let scale = 1; // 預設縮放為 1

        const style = window.getComputedStyle(_AutoScreenBlock);
        const transform = style.transform;

        if (transform && transform.startsWith('matrix(')) {
            const match = transform.match(/^matrix\((.+)\)$/);
            if (match) {
                const values = match[1].split(', ');
                scale = parseFloat(values[0]);
            }
        }

        let { width: autoScreenWidth, height: autoScreenHeight } = autoScreen.getBoundingClientRect();
        //autoScreenWidth *= scale;
        //autoScreenHeight *= scale;

        _AutoScreenBlock.style.width = `${((Math.ceil(autoScreenWidth * 100) / 100) + 2)      * scale  }px`;
        _AutoScreenBlock.style.height = `${((Math.ceil(autoScreenHeight * 100) / 100) + 50)   * scale  }px`;
    }

};

