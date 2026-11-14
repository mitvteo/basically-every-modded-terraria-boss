/** @type {HTMLCanvasElement} */
const main = document.getElementById('main');
const ctx = main.getContext('2d');

const waitUntil = async (predicateFn) => {
	while (!predicateFn()) {
		await new Promise(resolve => setTimeout(resolve, 50));
	}

	return true;
};

const easing = {};
{
	function merge(x, a, b) {
		return (x < 0.5) ? (a(x * 2) / 2) : (b(x * 2 - 1) / 2 + 0.5);
	}

	// ease linear
	easing[0] = x => x;

	// ease quad
	easing[1] = x => x * x;
	easing[2] = x => 1 - (1 - x) * (1 - x);
	easing[3] = x => merge(x, easing[1], easing[2]);
	easing[4] = x => merge(x, easing[2], easing[1]);

	// ease cubic
	easing[5] = x => x * x * x;
	easing[6] = x => 1 - Math.pow(1 - x, 3);
	easing[7] = x => merge(x, easing[5], easing[6]);
	easing[8] = x => merge(x, easing[6], easing[5]);

	// ease quart
	easing[9] = x => x * x * x * x;
	easing[10] = x => 1 - Math.pow(1 - x, 4);
	easing[11] = x => merge(x, easing[9], easing[10]);
	easing[12] = x => merge(x, easing[10], easing[9]);

	// ease quint
	easing[13] = x => x * x * x * x * x;
	easing[14] = x => 1 - Math.pow(1 - x, 5);
	easing[15] = x => merge(x, easing[13], easing[14]);
	easing[16] = x => merge(x, easing[14], easing[13]);

	// ease sine
	easing[17] = x => 1 - Math.cos((x * Math.acos(-1)) / 2);
	easing[18] = x => Math.sin((x * Math.acos(-1)) / 2);
	easing[19] = x => merge(x, easing[17], easing[18]);
	easing[20] = x => merge(x, easing[18], easing[17]);

	// ease expo
	easing[21] = x => x == 0 ? 0 : Math.pow(2, 10 * x - 10);
	easing[22] = x => 1 - (x == 1 ? 0 : Math.pow(2, 10 * (1 - x) - 10));
	easing[23] = x => merge(x, easing[21], easing[22]);
	easing[24] = x => merge(x, easing[22], easing[21]);

	// ease circ
	easing[25] = x => 1 - Math.sqrt(1 - Math.pow(x, 2));
	easing[26] = x => Math.sqrt(1 - Math.pow(x - 1, 2));
	easing[27] = x => merge(x, easing[25], easing[26]);
	easing[28] = x => merge(x, easing[26], easing[25]);

	// ease elastic
	easing[29] = x => 2.70158 * x * x * x - 1.70158 * x * x;
	easing[30] = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
	easing[31] = x => merge(x, easing[29], easing[30]);
	easing[32] = x => merge(x, easing[30], easing[29]);

	// ease back
	easing[33] = x => x == 0 ? 0 : (x == 1 ? 1 : (-Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * (2 * Math.acos(-1)) / 3)));
	easing[34] = x => x == 0 ? 0 : (x == 1 ? 1 : (Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.acos(-1)) / 3) + 1));
	easing[35] = x => merge(x, easing[33], easing[34]);
	easing[36] = x => merge(x, easing[34], easing[33]);

	// ease none
	easing[37] = x => x < 0.5 ? 0 : 1
}

function ease(a, n) {
	return easing[a](Math.min(Math.max(n, 0), 1));
}

let dialogues = {
	a: [
		"The world, blighted by the evils of this Earth.",
		"The determination of the fallen again him were in vain.",
		"A brave one stood out against the rest...",
		"You.",
		"One among the strongest within this treacherous land.",
		"After all had given up hope, will you?",
		"The path forward will be unforgiving and yields despair.",
		"Good luck."
	],
	b: [
		"Shall we try again?",
	],
	c: [
		"Thank you, brave one.",
		"The world is rescued from his oppression.",
		"YOU WIN!",
		"Made for Crescent Hackclub 2026",
	]
}

let pepTalk = true;
let pepTalkInfo = {
	line: 7,
	lineStart: performance.now() + 1000,
	content: dialogues.a,
	closeTime: 0,
	closed: false
};

const camera = {
	x: 0,
	y: 0,
	zoom: 0,
}

function rect(x, y, w, h, useRect) {
	const [width, height] = [main.width, main.height];
	const zoomMult = height / 720;
	ctx[useRect ? "rect" : "fillRect"]((x - camera.x) * zoomMult + width / 2, -(y - camera.y) * zoomMult + height / 2, w * zoomMult, h * zoomMult);
}

function letter(t, x, y, r) {
	const init = ctx.getTransform();

	ctx.translate(x, y);
	ctx.rotate(r);
	ctx.fillText(t, 0, 0);

	ctx.setTransform(init);
}

let clicked = false;
const plr = {
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	hp: 100,
}

document.addEventListener('click', e => {
	clicked = true;
});

let keysDown = new Set();

document.addEventListener('keydown', e => {
	e.preventDefault();
	if (!keysDown.has(e.key)) keysDown.add(e.key);
});
document.addEventListener('keyup', e => {
	e.preventDefault();
	keysDown.delete(e.key);
});

let lastFrame = performance.now();
function draw() {
	const now = performance.now();
	const delta = now - lastFrame;
	lastFrame = now;

	const [width, height] = [main.width, main.height] = [main.clientWidth * devicePixelRatio, main.clientHeight * devicePixelRatio];

	if (pepTalk) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const sizeMult = Math.floor(height / 30) / 24
		ctx.font = `${Math.floor(height / 30)}px pixel`;
		let at = (now - pepTalkInfo.lineStart) / 1000 * 40;
		let currentLine = pepTalkInfo.content[pepTalkInfo.line];
		if (currentLine && clicked && !pepTalkInfo.closed) {
			if ((at - 15) > currentLine.length) {
				pepTalkInfo.line++;
				pepTalkInfo.lineStart = now;
				currentLine = pepTalkInfo.content[pepTalkInfo.line];
				at = 0;
				if (!currentLine) {
					pepTalkInfo.closed = true;
					pepTalkInfo.closeTime = now;
				}
			} else {
				pepTalkInfo.lineStart = -1000000;
			}
		}
		pepTalkInfo.content.forEach((line, i) => {
			if (i <= pepTalkInfo.line) {
				ctx.globalAlpha = 1;
				line.split("").forEach((char, i2) => {
					if (i2 < at || pepTalkInfo.line > i) {
						const t = performance.now() / 400 + i2 + i * 0.8;
						let h = 1;
						if (pepTalkInfo.line === i) {
							ctx.globalAlpha = ease(2, (at - i2) / 10);
							h = ease(34, (at - i2) / 25);
						}
						letter(
							char,
							width / 2 + i2 * 14 * sizeMult + Math.sin(t) * 1.5 * sizeMult - (line.length + 0.5) * 14 * sizeMult / 2,
							height / 2 + Math.cos(t) * 1.5 * sizeMult + i * 32 * sizeMult + 20 - h * 20 - pepTalkInfo.content.length * 32 * sizeMult / 2,
							0 + Math.sin(t + 0.8) * 0.1,
						)
					}
				})
			}
		});
		ctx.globalAlpha = 1;
		if (!pepTalkInfo.closed && currentLine && (at - 15) > currentLine.length) {
			const y = height / 2 + pepTalkInfo.line * 32 * sizeMult - pepTalkInfo.content.length * 32 * sizeMult / 2 + 50 * sizeMult + Math.abs(Math.sin(performance.now() / 100)) * -4 * sizeMult;
			ctx.fillStyle = "#fff";
			ctx.beginPath();
			ctx.moveTo(width / 2 - 8 * sizeMult, y);
			ctx.lineTo(width / 2 + 8 * sizeMult, y);
			ctx.lineTo(width / 2, y + 8 * sizeMult);
			ctx.closePath();
			ctx.fill();
		}

		if (pepTalkInfo.closed) {
			ctx.globalAlpha = (now - pepTalkInfo.closeTime) / 2000;
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, width, height);
			if ((now - pepTalkInfo.closeTime) >= 2000) {
				pepTalk = false;
				pepTalkInfo.line = 0;
				pepTalkInfo.closed = false;
			}
		}
	} else {
		const sizeMult = height / 2000;
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "#fff";
		rect(plr.x - 12, plr.y - 12, 24, 36);

		ctx.fillStyle = "#222";
		rect(plr.x - 800, -48, 1600, 1600)
		ctx.fillStyle = "#444";
		for (let i = -50; i < 50; i++) {
			rect((Math.floor(plr.x / 48) + i) * 48, -48, 2, 16)
		}

		// player movement
		if (keysDown.has("a")) {
			plr.vx -= 2;
		}
		if (keysDown.has("d")) {
			plr.vx += 2;
		}
		if (keysDown.has("w") || keysDown.has(" ")) {
			plr.vy += 1;
		}
		if (keysDown.has("s")) {
			plr.vy -= 0.8;
		}
		plr.vx *= 0.85;
		plr.x += plr.vx;
		plr.vy -= 0.4;
		plr.vy *= 0.95;
		plr.y += plr.vy;
		if (plr.y < 0 && plr.vy < 0) {
			plr.y = 0;
			plr.vy = 0;
		}
		if (plr.y > 2400 + 12 && plr.vy > 0) {
			plr.y = 2400 + 12;
			plr.vy = 0;
		}
		if (plr.x < -2400 + 12 && plr.vx < 0) {
			plr.x = -2400 + 12;
			plr.vx = 0;
		}
		if (plr.x > 2400 - 12 && plr.vx > 0) {
			plr.x = 2400 - 12;
			plr.vx = 0;
		}

		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, width, height)
		rect(-2400, 2400, 4800, 9600, true);
		ctx.clip('evenodd'); // why is it called this when it can be called invert
		ctx.globalAlpha = 0.25;
		ctx.fillStyle = "#48b";
		ctx.fillRect(0, 0, width, height);
		ctx.globalAlpha = 0.5;
		ctx.translate(width / 2, height / 2);
		ctx.rotate(Math.PI * 0.25);
		for (let i = -50; i < 50; i++) {
			ctx.fillRect(-width * 2, i * 100 * sizeMult + ((performance.now() / 2) % 100) * sizeMult, width * 4, 40 * sizeMult);
		}
		ctx.restore();

		camera.x = plr.x;
		camera.y = plr.y;

		if (plr.hp <= 0) {
			pepTalk = true;
			pepTalkInfo.lineStart = now + 1000;
			pepTalkInfo.content = dialogues.b;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, width, height);
		}
	}

	clicked = false;

	requestAnimationFrame(draw);
}

draw();
