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
	line: 0,
	lineStart: performance.now() + 1000,
	content: dialogues.a,
	closeTime: 0,
	closed: false
};

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
	hp: 100,
}

document.addEventListener('click', e => {
	clicked = true;
})

let lastFrame = performance.now();
function draw() {
	const now = performance.now();
	const delta = now - lastFrame;
	lastFrame = now;

	const [width, height] = [main.width, main.height] = [main.clientWidth, main.clientHeight];

	if (pepTalk) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = "24px pixel";
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
							width / 2 + i2 * 12 + Math.sin(t) * 1.5 - line.length * 12 / 2 + 6,
							height / 2 + Math.cos(t) * 1.5 + i * 32 + 20 - h * 20 - pepTalkInfo.content.length * 32 / 2,
							0 + Math.sin(t + 0.8) * 0.1,
						)
					}
				})
			}
		});
		ctx.globalAlpha = 1;
		if (!pepTalkInfo.closed && currentLine && (at - 15) > currentLine.length) {
			const y = height / 2 + pepTalkInfo.line * 32 - pepTalkInfo.content.length * 32 / 2 + 50 + Math.abs(Math.sin(performance.now() / 100)) * -4;
			ctx.fillStyle = "#fff";
			ctx.beginPath();
			ctx.moveTo(width / 2 - 8, y);
			ctx.lineTo(width / 2 + 8, y);
			ctx.lineTo(width / 2, y + 8);
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
		pepTalk = true;
		pepTalkInfo.lineStart = now + 1000;
		pepTalkInfo.content = dialogues.b;
	}

	clicked = false;

	requestAnimationFrame(draw);
}

draw();
