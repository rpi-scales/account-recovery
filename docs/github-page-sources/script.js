
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
let timeCount = setInterval(myTimer, 100);
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
    this.colortimeA = [];
    this.colortimeB = [];
    /**
     * set sky color according to current time
     * @param {int} hour - the time of the day. Used to calculate the color based on four base colors matching the current time.
     */
    this.changeSkyColor = function (hour) {

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

let subheaderfull = "Introduction";
let subheadertext = "";
let subheaderplace = 0;

let global = new Globals();


/** Increament graphics animation in a infinite loop by one frame at a time.
 */
function myTimer() {
    time += 1
    if (subheaderplace < subheaderfull.length){
        subheadertext += subheaderfull.charAt(subheaderplace);
        subheaderplace+=1;
        document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "&nbsp */";
    }

    if (time%8 < 4) {
        document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "| */";
    }
    else {
        document.getElementById("indexsubheader").innerHTML = "/* " +subheadertext + "&nbsp */";
    }
    if (time%600 == 1) {
        global.refreshClock();
    }
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

    document.getElementById("pBarL").style.width = Math.round(pct*50).toString() +"%";
    document.getElementById("pBarR").style.width = Math.round(pct*50).toString() +"%";
    if (scroll <= 1080) {
        document.getElementById("intro-content").style.top = Math.round(scroll/4).toString() + "px";
        document.getElementById("intro-content").style.opacity = Math.max(0, 1-scroll*0.001).toString();
        if (pos != 0 && pageW > 992) {
            pos = 0
            subheaderplace = 0;
            subheadertext = "";
			document.getElementById("topMenuMain").style.height = "0px";
            document.getElementById("headline").style.top = "-50px";
			document.getElementById("but4").style.top = "0px";
        }
    } else if (scroll > 1080 && pageW > 992) {
        if (pos == 0) {
            pos = 1;
			document.getElementById("topMenuMain").style.height = "70px";
            document.getElementById("headline").style.top = "20px";
			document.getElementById("but4").style.top = "-70px";
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
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function displayfeature(type, init) {
	if (type == 1 && init == 1) {
		document.getElementById("f1txt").innerText = "To prevent a single point of failure. We designed the solution avoided the involvement of any third party, as user-submitted transactions drive the account recovery process. And the decision-making process is also decentralized.";
	}
	if (type == 1 && init == 0) {
		document.getElementById("f1txt").innerText = "The solution avoided using any third party action in the account recovery process.";
	}
	if (type == 2 && init == 1) {
		document.getElementById("f2txt").innerText = "Compared to existing work, the recovery process does not require the user to take any action before the recovery, which is significant as some users might not be forward-thinking to prepare for losing an account in the future. ";
	}
	if (type == 2 && init == 0) {
		document.getElementById("f2txt").innerText = "Requires no additional steps before the account was lost.";
	} 
	if (type == 3 && init == 1) {
		document.getElementById("f3txt").innerText = "We did not use evidence like email or the social security number like in centralized applications. The evidence will be transaction details that the user still remember. The trade partners can then vote individually if this corresponding information is correct. ";
	} 
	if (type == 3 && init == 0) {
		document.getElementById("f3txt").innerText = "The verification is based on the information asymmetry between a random user and previous trade partners.";
	} 
}
