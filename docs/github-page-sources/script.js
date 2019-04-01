
let headlineshow = 0;
function showTopNav(){
    if (!headlineshow){
        document.getElementById('headline').style.display = "block";
        document.getElementById('topmenushow').innerHTML = "&#10005";
        headlineshow = 1;
    } else {
        document.getElementById('headline').style.display = "none";
        document.getElementById('topmenushow').innerHTML = "&#9776";
        headlineshow = 0;
    }
}
let pageH = $(window).height();
let pageW = $(window).width();
let docH = $(document).height();
let scrollY = window.pageYOffset;

/*
$('a[href^="#"]').on('click', function(event) {
*/
$('.button').on('click', function(event) {
    var target = $(this.getAttribute('href'));
    if( target.length ) {
        event.preventDefault();
        $('html, body').stop().animate({
            scrollTop: target.offset().top
        }, 500);
    }
});


let time = 0;
let time2 = 0;
let timeCount = setInterval(myTimer, 50);
//let colors = [[42, 187, 252], [54, 131, 245]]
let colors = [[42, 187, 252], [44, 111, 215]]
//let colors = [[180, 180, 180], [160, 160, 160]];
let colorA = 0
let cStepA = 0.5
let colorB = 0
let cStepB = 0.5


function graphicComponents() {
    this.preview = 0;
}

function Globals() {
    this.hour = new Date().getHours();
    this.colortimeA = [[0,0,5], [0,0,5], [0,0,5], [0,0,5], [0,10,15], [10,35,55], [20,55,85], [22,58,90], [25,59,97], [29,60,111], [30,61,117], [31,62,119], [32,63,121], [33,63,119], [34,63,117], [35,63,115], [36,63,105], [38,63,95], [40,63,90], [20,30,61], [0,10,25], [0,5,15], [
        0,0,5], [
        0,0,5]];
    this.colortimeB = [[0,5,25], [0,5,25], [0,5,25], [0,5,25], [0,15,30], [45,35,40], [85,55,50], [95,145,210], [106,146,211], [107,147,212], [108,148,213], [109,149,214], [110,150,215], [111,149,211], [114,148,207], [118,147,195], [124,144,170], [145,142,135], [169,140,95], [100,80,60], [15,10,45], [0,10,35], [0,5,25], [0,5,25]];


    /**
     * set sky color according to current time
     * @param {int} hour - the time of the day. Used to calculate the color based on four base colors matching the current time.
     */
    this.changeSkyColor = function (hour) {
        let colorsA = this.colortimeA[hour];
        let colorsB = this.colortimeB[hour];


        /* The old version, using four pivot time to give the color of the sky at the current time, doesn't look good
        if (hour < 6) {
            for (let i=0; i < 3; i++) {
                let ratio = hour/6; // ratio of 6am color
                colorsA.push(Math.round(this.colortimeA[0][i] * ratio + this.colortimeA[3][i] * (1 - ratio)));
                colorsB.push(Math.round(this.colortimeB[0][i] * ratio + this.colortimeB[3][i] * (1 - ratio)));
            }
        } else if (hour < 12) {
            for (let i=0; i < 3; i++) {
                let ratio = (hour-6)/6; // ratio of 12am color
                colorsA.push(Math.round(this.colortimeA[1][i] * ratio + this.colortimeA[0][i] * (1 - ratio)));
                colorsB.push(Math.round(this.colortimeB[1][i] * ratio + this.colortimeB[0][i] * (1 - ratio)));
            }
        } else if (hour < 18) {
            for (let i=0; i < 3; i++) {
                let ratio = (hour-12)/6; // ratio of 18am color
                colorsA.push(Math.round(this.colortimeA[2][i] * ratio + this.colortimeA[1][i] * (1 - ratio)));
                colorsB.push(Math.round(this.colortimeB[2][i] * ratio + this.colortimeB[1][i] * (1 - ratio)));
            }
        } else if (hour < 24) {
            for (let i=0; i < 3; i++) {
                let ratio = (hour-18)/6; // ratio of 0am color
                colorsA.push(Math.round(this.colortimeA[3][i] * ratio + this.colortimeA[2][i] * (1 - ratio)));
                colorsB.push(Math.round(this.colortimeB[3][i] * ratio + this.colortimeB[2][i] * (1 - ratio)));
            }
        } else {

        }
        */
        let gradBeg = 'rgba(' + colorsA[0].toString() + ', ' + colorsA[1].toString() + ', ' + colorsA[2].toString() + ', 1)';
        let gradEnd = 'rgba(' + colorsB[0].toString() + ', ' + colorsB[1].toString() + ', ' + colorsB[2].toString() + ', 1)';
        let gradient = 'linear-gradient(' + gradBeg + ', ' + gradEnd + ')';
        document.getElementById('intro0').style.background = gradient;
    };

    /**
     * fresh the hour clock and sky color, called every 10 miniutes
     */
    this.refreshClock = function () {
        this.hour = new Date().getHours();
        this.changeSkyColor(this.hour);
    };
}

/**
 * Creates an instance of class for the perspective cloud graphics.
 */
function GraphicCloud() {
    this.data = []; // left, top, width, transparency
    this.clouds = document.getElementsByClassName("graphics-element cloud");
    this.center = {x: Math.round(pageW/2), y:Math.round(pageH/2)};  // the center of the perspective
    this.k = 10000;  // smaller value represent larger movement

    /**
     * Setting the clouds
     */
    this.set = function() {
        let shax = this.center.x - mouseX;
        let shay = this.center.y - mouseY - 3*scroll;
        for (let i=0; i < this.clouds.length; i++){
            this.clouds[i].style.left = Math.round((this.data[i][0] + shax/this.k*this.data[i][2]) * pageW).toString() + "px";
            this.clouds[i].style.top = Math.round((this.data[i][1] + shay/this.k*this.data[i][2])* pageH).toString() + "px";
            if (4 < global.hour && global.hour < 20) {
                this.clouds[i].style.backgroundImage  = "url('github-page-sources/images/cloud0.png')"
            } else {
                this.clouds[i].style.backgroundImage  = "url('github-page-sources/images/cloud1.png')"
            }
        }
    };

    /**
     * Avoid abrupt shift in cloud position when the mouse moves out of the broswer and reenters
     */
    this.reCenter = function(xdiff, ydiff) {
        this.center.x += Math.round(xdiff);
        this.center.y += Math.round(ydiff);
    }

    /**
     * The clouds are drifting overtime from left to right
     */
    this.drift = function () {
        this.center.x += 10;
        if (this.center.x > 9007199254740975){
            this.center.x = 0
        }
        this.set();
        this.relocate();
    }

    /**
     * When the clouds drifted away, put them back to the left
     */
    this.relocate = function () {
        for (let i=0; i < this.clouds.length; i++){
            let le = parseInt(this.clouds[i].style.left.replace('px', ''));
            let wi = parseInt(this.clouds[i].style.width.replace('px', ''));
            if (le > pageW) {
                this.clouds[i].style.display = "block";
                this.data[i][0] -= 1.1 + wi/pageW;
            }
        }
    }

    /**
     * Clouds should not be the same every time you loaded the website
     */
    this.randomize = function () {
        this.data = [];
        for (let ci = 0; ci < 10; ci += 1) {
            let a = Math.random()
            let left_c = Math.random() * 0.2 + ci * 0.14 - 0.2;
            let top_c = Math.random() * 0.9 + 0.1;
            let width_c = Math.random() * 0.9 + 0.2;
            let trans_c = width_c/5 + 0.3;
            this.data.push([left_c - width_c/2, top_c - width_c/2, width_c, trans_c]);
        }
        for (let i=0; i < this.clouds.length; i++){
            this.clouds[i].style.left = Math.round(this.data[i][0] * pageW).toString() + "px";
            this.clouds[i].style.top = Math.round(this.data[i][1] * pageW).toString() + "px";
            this.clouds[i].style.width = Math.round(this.data[i][2] * pageW).toString() + "px";
            this.clouds[i].style.height = Math.round(this.data[i][2] * pageW).toString() + "px";
            this.clouds[i].style.opacity = (this.data[i][3]).toString();
            this.clouds[i].style.display = "block";
        }
    };

    this.show = function() {
        for (let i=0; i < this.clouds.length; i++){
            this.clouds[i].style.display = "block";
        }
    };

    this.hide = function() {
        for (let i=0; i < this.clouds.length; i++){
            this.clouds[i].style.display = "none";
        }
    };
};

let gcomp = new graphicComponents();
let gclouds = new GraphicCloud();
gclouds.randomize();

let subheaderfull = "Introduction";
let subheadertext = "";
let subheaderplace = 0;

let global = new Globals();


/** Increament graphics animation in a infinite loop by one frame at a time.
 */
function myTimer() {
    time += 1

    /*
    colorA += cStepA;
    colorB += cStepB;

    if (colorA >= 80) {
        cStepA = -1
    } else if (colorA <= 0) {
        cStepA = 1
    }
    if (colorB >= 60) {
        cStepB = -1
    } else if (colorB <= 0) {
        cStepB = 1
    }
    let colorsA = [0, 0, 0]
    let colorsB = [0, 0, 0]
    colorsA[0] = Math.round(colors[0][0] + colorA)
    colorsA[1] = Math.round(colors[0][1] + colorA)
    colorsA[2] = Math.round(colors[0][2] - 2 * colorA)
    colorsA[2] = colors[0][2]

    colorsB[0] = Math.round(colors[1][0] - 2 * colorB)
    colorsB[1] = Math.round(colors[1][1] + colorB)
    colorsB[2] = Math.round(colors[1][2] + colorB)

    let gradBeg = 'rgba(' + colorsA[0].toString() + ', ' + colorsA[1].toString() + ', ' + colorsA[2].toString() + ', 0.7)'
    let gradEnd = 'rgba(' + colorsB[0].toString() + ', ' + colorsB[1].toString() + ', ' + colorsB[2].toString() + ', 0.5)'
    let gradient = 'linear-gradient(' + gradBeg + ', ' + gradEnd + ')'
    document.getElementById('intro-overlay').style.background = gradient
    */
    if (time%2 == 1) {
        if (subheaderplace < subheaderfull.length){
            subheadertext += subheaderfull.charAt(subheaderplace);
            subheaderplace+=1;
            document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "&nbsp */";
        }

        if (time%10 < 5) {
            document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "| */";
        }
        else {
            document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "&nbsp */";
        }
    }
    if (time%600 == 1) {
        global.refreshClock();
    }
    gclouds.drift();
}

let pos = 0;
let sBg = 0;
let buttonsLit = [0, 0, 0, 0];
let lastslideprecentage = 0;


$(window).resize(function() {
    bubbleTime = 0;
    pageH = $(window).height();
    pageW = $(window).width();
    if (pageW >= 992 && !headlineshow){
        document.getElementById('headline').style.display = "block";
        document.getElementById('topmenushow').innerHTML = "&#10005";
        headlineshow = 1;
    }
});
let scroll = window.pageYOffset;
let windowSize = [pageH, pageW];
$(window).scroll(function (event) {

    scroll = window.pageYOffset;
    docH = $(document).height();
    let pct = scroll/(docH-pageH-150);
    gclouds.set();

    document.getElementById("pBarL").style.width = Math.round(pct*50).toString() +"%";
    document.getElementById("pBarR").style.width = Math.round(pct*50).toString() +"%";
    if (scroll <= 1080) {
        document.getElementById("intro-content").style.top = Math.round(scroll/4).toString() + "px";
        document.getElementById("intro-content").style.opacity = Math.max(0, 1-scroll*0.001).toString();
        if (pos != 0) {
            pos = 0
            subheaderplace = 0;
            subheadertext = "";
            gclouds.show();
			document.getElementById("topMenuMain").style.height = "0px";
            document.getElementById("headline").style.top = "-50px";

        }
    } else if (scroll > 1080) {
        if (pos == 0) {
            pos = 1;
			gclouds.hide();
			document.getElementById("topMenuMain").style.height = "70px";
            document.getElementById("headline").style.top = "20px";
        }
    }
});

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', mouseMoves);
/** get mouseMoves position
 @param {event} event - the event
 */
function mouseMoves(event) {
    if (Math.abs(event.clientX - mouseX) > 100 || Math.abs(event.clientY - mouseY) > 100) {
        gclouds.reCenter(event.clientX - mouseX, event.clientY - mouseY);
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
    gclouds.set();
}
