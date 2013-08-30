function attachUserMedia(videoElement) {
	if ("getUserMedia" in navigator) {
		navigator.getUserMedia(
			{video : true},
			function(stream) {
				videoElement.src = stream;
			},
			function(e) {
				console.log(err);
			}
		);
	} else if ("webkitGetUserMedia" in navigator) {
		navigator.webkitGetUserMedia(
			{video : true},
			function(stream) {
				var url = webkitURL.createObjectURL(stream);
				videoElement.src = url;
			},
			function(e) {
				console.log(e);
			}
		);
	} else {
		console.log("nothing : user stream");
	}
}

var video;
var mist;
var mirror;

var mistContext;
var mirrorContext;

var videoWidth;
var videoHeight;

function drawMist() {
	var mistImageData = mistContext.getImageData(0, 0, videoWidth, videoHeight);
	var mistData = mistImageData.data;
	for (var y = 0; y < videoHeight; y++) {
		var offsetY = y * videoWidth;
		for (var x = 0; x < videoWidth; x++) {
			var offsetXY = (offsetY + x) * 4;
			var color = mistData[offsetXY + 0];
			color += 5;
			if (color > 255) {
				color = 255;
			}
			mistData[offsetXY + 0] =
			mistData[offsetXY + 1] =
			mistData[offsetXY + 2] =
			color;
		}
	}
	mistContext.putImageData(mistImageData,0,0);
}

function drawMirror() {
	mirrorContext.drawImage(video, 0, 0);
	var mistImageData   = mistContext  .getImageData(0, 0, videoWidth, videoHeight);
	var mirrorImageData = mirrorContext.getImageData(0, 0, videoWidth, videoHeight);
	var mistData   = mistImageData  .data;
	var mirrorData = mirrorImageData.data;
	for (var y = 0; y < videoHeight; y++) {
		var offsetY = y * videoWidth;
		for (var x = 0; x < videoWidth; x++) {
			var offsetXY = (offsetY + x) * 4;
			mirrorData[offsetXY + 3] = mistData[offsetXY + 0];
		}
	}
	mirrorContext.putImageData(mirrorImageData,0,0);
}


function draw() {
	drawMist();
	drawMirror();
	requestAnimationFrame(draw);
}

function leapLoop(obj) {

	var hands = obj.hands.map(function(d) {
		return {
			id: d.id,
			length: d.length,
			directionX: d.direction[0],
			directionY: d.direction[1],
			directionZ: d.direction[2],
			palmNormalX: d.palmNormal[0],
			palmNormalY: d.palmNormal[1],
			palmNormalZ: d.palmNormal[2],
			palmPositionX: d.palmPosition[0],
			palmPositionY: d.palmPosition[1],
			palmPositionZ: d.palmPosition[2],
			palmVelocityX: d.palmVelocity[0],
			palmVelocityY: d.palmVelocity[1],
			palmVelocityZ: d.palmVelocity[2],
			sphereCenterX: d.sphereCenter[0],
			sphereCenterY: d.sphereCenter[1],
			sphereCenterZ: d.sphereCenter[2],
			sphereRadius: d.sphereRadius
		};
	});

	var fingers = obj.fingers.map(function(d) {
		return {
			id: d.id,
			handId: d.handId,
			length: d.length,
			directionX: d.direction[0],
			directionY: d.direction[1],
			directionZ: d.direction[2],
			tipPositionX: d.tipPosition[0],
			tipPositionY: d.tipPosition[1],
			tipPositionZ: d.tipPosition[2],
			tipVelocityX: d.tipVelocity[0],
			tipVelocityY: d.tipVelocity[1],
			tipVelocityZ: d.tipVelocity[2]
		};
	});

	var fingerGroups = {};
	fingers.forEach(function(finger) {
		var handId = finger.handId.toString(10);
		if (!(handId in fingerGroups)) {
			fingerGroups[handId] = [];
		}
		fingerGroups[handId].push(finger);
	});

	var edgeLength = Math.max(videoWidth, videoHeight);

	hands.forEach(function(hand) {
		fingers = fingerGroups[hand.id.toString(10)];

		if (!fingers || fingers.length < 2) {
			return;
		}
		var x  = ((-hand.palmPositionX + 150) / 300) * edgeLength + (videoWidth  - edgeLength);
		var y  = (( hand.palmPositionZ + 150) / 300) * edgeLength + (videoHeight - edgeLength);

		mistContext.fillStyle = "rgb(0, 0, 0)";
		mistContext.beginPath();
		mistContext.arc(x, y, 80, 0, Math.PI*2, false);
		mistContext.fill();
		fingers.forEach(function(finger) {
			for (var cur = 0, to = 30; cur <= to; cur++) {
				var x  = ((-(finger.tipPositionX * cur + hand.palmPositionX * (to - cur)) / to + 150) / 300) * edgeLength + (videoWidth  - edgeLength);
				var y  = (( (finger.tipPositionZ * cur + hand.palmPositionZ * (to - cur)) / to + 150) / 300) * edgeLength + (videoHeight - edgeLength);
				mistContext.fillStyle = "rgb(0, 0, 0)";
				mistContext.beginPath();
				mistContext.arc(x, y, 20, 0, Math.PI*2, false);
				mistContext.fill();
			}
		});
	});

};

var initialize = function() {

	video    = document.getElementById("video");
	mist     = document.getElementById("mist");
	mirror   = document.getElementById("mirror");
	mistContext     = mist    .getContext("2d");
	mirrorContext   = mirror  .getContext("2d");

	video.addEventListener(
		"playing",
		function(e){

			var style  = window.getComputedStyle(video, null);
			videoWidth  = parseInt(style.width, 10);
			videoHeight = parseInt(style.height, 10);

			mist.width      = videoWidth;
			mist.height     = videoHeight;
			mirror.width    = videoWidth;
			mirror.height   = videoHeight;

//			mist.style.width      = videoWidth * 1.5 + "px";
//			mist.style.height     = videoHeight * 1.5 + "px";
//			mirror.style.width    = videoWidth * 1.5 + "px";
//			mirror.style.height   = videoHeight * 1.5 + "px";
//			video.style.width     = videoWidth * 1.5 + "px";
//			video.style.height    = videoHeight * 1.5 + "px";

			mist.style.width      = "960px";
			mirror.style.width    = "960px";
			video.style.width     = "960px";

			mistContext.fillStyle = "rgb(255, 255, 255)";
			mistContext.fillRect(0 ,0, videoWidth, videoHeight);

			draw();
			Leap.loop(leapLoop);

		},
		false
	);

	attachUserMedia(document.getElementById("video"));

};

window.addEventListener("load", initialize, false);
