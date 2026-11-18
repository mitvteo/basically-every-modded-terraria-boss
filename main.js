/** @type {HTMLCanvasElement} */
const main = document.getElementById('main');
const ctx = main.getContext('2d');

const audio = new AudioContext();

let buffer;
(async () => {
	buffer = await audio.decodeAudioData(await (await fetch('last.mp3')).arrayBuffer());
})();
let bgm;

let sfx = {};

[
	'death.flac',
	'shatter.mp3',
	'glass.mp3'
].forEach(async v => {
	sfx[v] = await audio.decodeAudioData(await (await fetch(`sounds/${v}`)).arrayBuffer());
})

// JAVASCRIPT GIVE US A NATIVE LERP FUNCTION PLEASEEEEEE
const lerp = (a, b, t) => a * (1 - t) + b * t;
const clamp = (a, m, n) => Math.min(Math.max(a, m), n);

const rpc = () => {
	const angle = Math.random() * 2 * Math.PI;
	const r = Math.sqrt(Math.random());
	const x = r * Math.cos(angle);
	const y = r * Math.sin(angle);

	return { x, y };
}
const rp = () => {
	const angle = Math.random() * 2 * Math.PI;
	const x = Math.cos(angle);
	const y = Math.sin(angle);

	return { x, y };
}

const waitUntil = async (predicateFn) => {
	while (!predicateFn()) {
		await new Promise(resolve => setTimeout(resolve, 50));
	}

	return true;
};

function rectToCorners(rect) {
	const cos = Math.cos(-rect.r);
	const sin = Math.sin(-rect.r);
	const w2 = rect.w / 2;
	const h2 = rect.h / 2;

	return [
		{
			x: rect.x + (-w2 * cos - -h2 * sin),
			y: rect.y + (-w2 * sin + -h2 * cos)
		},
		{
			x: rect.x + (w2 * cos - -h2 * sin),
			y: rect.y + (w2 * sin + -h2 * cos)
		},
		{
			x: rect.x + (w2 * cos - h2 * sin),
			y: rect.y + (w2 * sin + h2 * cos)
		},
		{
			x: rect.x + (-w2 * cos - h2 * sin),
			y: rect.y + (-w2 * sin + h2 * cos)
		}
	];
}

function projectCorners(c, a) {
	let min = Infinity;
	let max = -Infinity;

	for (let i = 0; i < c.length; i++) {
		const dot = c[i].x * a.x + c[i].y * a.y;
		if (dot < min) min = dot;
		if (dot > max) max = dot;
	}

	return { min, max };
}

// note to self: this is centered rectangle!!!! same for drawing rectangles!!
function collision(rect1, rect2) {
	if (rect1.r == 0 && rect2.r == 0) {
		return simpleCollision(rect1, rect2);
	}

	rect1 = rectToCorners(rect1);
	rect2 = rectToCorners(rect2);

	const axes = [
		{ x: rect1[1].x - rect1[0].x, y: rect1[1].y - rect1[0].y },
		{ x: rect1[1].x - rect1[2].x, y: rect1[1].y - rect1[2].y },
		{ x: rect2[1].x - rect2[0].x, y: rect2[1].y - rect2[0].y },
		{ x: rect2[1].x - rect2[2].x, y: rect2[1].y - rect2[2].y }
	];

	for (let i = 0; i < axes.length; i++) {
		const a = axes[i];
		const length = Math.sqrt(a.x * a.x + a.y * a.y);
		const normAxis = { x: a.x / length, y: a.y / length };

		const proj1 = projectCorners(rect1, normAxis);
		const proj2 = projectCorners(rect2, normAxis);

		if ((proj1.max < proj2.min || proj2.max < proj1.min)) {
			return false;
		}
	}

	return true;
}
function simpleCollision(rect1, rect2) {
	// this bad but i think objects take up more memory idk how to fix i come back later
	const left1 = rect1.x - rect1.w * 0.5;
	const right1 = rect1.x + rect1.w * 0.5;
	const bottom1 = rect1.y - rect1.h * 0.5;
	const top1 = rect1.y + rect1.h * 0.5;
	const left2 = rect2.x - rect2.w * 0.5;
	const right2 = rect2.x + rect2.w * 0.5;
	const bottom2 = rect2.y - rect2.h * 0.5;
	const top2 = rect2.y + rect2.h * 0.5;
	return (
		left1 < right2 &&
		right1 > left2 &&
		bottom1 < top2 &&
		top1 > bottom2
	);
}

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
	zoom: 1,
}

function getWorldPosition(pos) {
	const [width, height] = [main.width, main.height];
	const zoomMult = height / 720 * camera.zoom;
	return { x: (pos.x - camera.x) * zoomMult + width / 2, y: -(pos.y - camera.y) * zoomMult + height / 2 };
}

// note to self: this is centered rectangle!!!! same for rect collisions!!
function rotrect(rect, override, useRect) {
	const [width, height] = [main.width, main.height];
	const zoomMult = height / 720 * camera.zoom;
	const transform = ctx.getTransform();
	ctx.translate((rect.x - camera.x) * zoomMult + width / 2, -(rect.y - camera.y) * zoomMult + height / 2);
	ctx.rotate(rect.r);
	ctx[useRect ? "rect" : "fillRect"]((override.w ?? rect.w) * zoomMult * -0.5, (override.h ?? rect.h) * zoomMult * -0.5, (override.w ?? rect.w) * zoomMult, (override.h ?? rect.h) * zoomMult);
	ctx.setTransform(ctx);
}

function rect(x, y, w, h, useRect, center) {
	const [width, height] = [main.width, main.height];
	const zoomMult = height / 720 * camera.zoom;
	ctx[useRect ? "rect" : "fillRect"]((x - camera.x) * zoomMult - (center ? (w * zoomMult / 2) : 0) + width / 2, -(y - camera.y) * zoomMult + height / 2 - (center ? (h * zoomMult / 2) : 0), w * zoomMult, h * zoomMult);
}
function line(x1, y1, x2, y2) {
	const [width, height] = [main.width, main.height];
	const zoomMult = height / 720;
	ctx.moveTo((x1 - camera.x) * zoomMult + width / 2, -(y1 - camera.y) * zoomMult + height / 2);
	ctx.lineTo((x2 - camera.x) * zoomMult + width / 2, -(y2 - camera.y) * zoomMult + height / 2);
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
	iframes: 0,
	dashDir: null,
	lastDashPress: 0,
	dashCD: 0,
	willDash: false,
}
const boss = {
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	hp: 15000,
	focus: 1,
	rotation: 0,
}

document.addEventListener('mousedown', e => {
	clicked = true;

	if (e.button === 2) {
		const dir = plr.vx > 0;
		plr.dashDir = dir;
		plr.willDash = true;
		plr.lastDashPress = 0;
	}
});

let keysDown = new Set();

document.addEventListener('contextmenu', e => {
	e.preventDefault();
})

document.addEventListener('keydown', e => {
	e.preventDefault();
	if (!keysDown.has(e.code)) {
		keysDown.add(e.code);

		if (!pepTalk && plr.dashCD <= 0) {
			if (e.code == "KeyA" || e.code == "KeyD") {
				const dir = e.code == "KeyD";
				if (plr.dashDir == dir && (performance.now() - plr.lastDashPress) < 200) {
					plr.willDash = true;
					plr.lastDashPress = 0;
				} else {
					plr.dashDir = dir;
					plr.lastDashPress = performance.now();
				}
			}
		}
	}
});
document.addEventListener('keyup', e => {
	e.preventDefault();
	keysDown.delete(e.code);
});

let musicToast = -100000;
async function startMusic(t) {
	if (bgm) bgm.stop();
	bgm = audio.createBufferSource();
	await waitUntil(() => !!buffer);
	bgm.buffer = buffer;
	bgm.loop = true;
	bgm.connect(audio.destination);
	bgm.start(t ?? 0);
	musicToast = performance.now();
}
const sounds = new Set();
function sound(n, t, v) {
	const s = audio.createBufferSource();
	const g = audio.createGain();
	g.gain.value = v ?? 1;
	s.buffer = sfx[n];
	s.connect(g);
	g.connect(audio.destination);
	s.start(t ?? 0);
	s.onended = () => {
		sounds.delete(s);
		s.disconnect();
		g.disconnect();
	};
	sounds.add(s);
}
function stopAllSounds() {
	sounds.forEach(s => {
		s.stop();
	})
}
function stopMusic(t) {
	if (bgm) bgm.stop();
}

const particles = new Set();

class Particle {
	constructor(data) {
		this.data = data;
		this.start = performance.now();
	}

	get expired() {
		return performance.now() > this.start + this.data.l;
	}

	draw() {
		const data = this.data;
		const t = (performance.now() - this.start) / data.l;
		const lp = ease(data.easepos ?? 0, t);
		const ls = ease(data.easesize ?? 0, t);
		const size = lerp(data.ss, data.es, ls);
		ctx.beginPath();
		rect(lerp(data.s.x, data.e?.x ?? data.s.x, lp), lerp(data.s.y, data.e?.y ?? data.s.y, lp), size, size * (data.sr ?? 1), true, true);
		if (data.clr) {
			ctx.fillStyle = data.clr;
			ctx.fill();
		}
		if (data.stroke) {
			ctx.strokeStyle = data.stroke;
			ctx.lineWidth = data.lw;
			ctx.stroke();
		}
	}
}

const plrCollision = { x: plr.x, y: plr.y, w: 16, h: 24, r: 0 };
let f = 0; // btw physics runs at 120 fps
let lastDraw = undefined;

class Attack {
	constructor(lifetime) {
		this.start = f;
		this.lifetime = lifetime;
	}

	get expired() {
		return f > this.start + this.lifetime;
	}
}

function dmg(amt) {
	if (plr.iframes <= 0) {
		plr.hp -= amt;
		plr.iframes = 120;
		sound('glass.mp3', null, 6);
		ss += 350;

		for (let _ = 0; _ < 15; _++) {
			const { x, y } = rp();
			particles.add(new Particle({
				s: { x: plr.x, y: plr.y },
				e: { x: plr.x + x * 96, y: plr.y + y * 96 },
				ss: 24 * Math.random(), es: 0,
				easepos: 10, easesize: 10,
				l: Math.random() * 1000 + 1000,
				clr: "#fff"
			}));
		}
	}
}

function angle(current, target) {
	let d = (target - current) % Math.PI * 2;
	if (d < -Math.PI) d += Math.PI * 2;
	if (d > Math.PI) d -= Math.PI * 2;
	return d;
}

// TODO
class AttackMissile extends Attack {
	constructor() {
		super(660);
		this.x = boss.x;
		this.y = boss.y;
		this.vx = 0;
		this.vy = 0;
		this.rot = (Math.random() - 0.5) * 2 * Math.PI;
		this.vrot = (Math.random() - 0.5) * 2 * Math.PI;
		this.points = [];
		this.collision = { w: 0, h: 0, r: 0 };
		this.boom = false;
		ss += 50;
		sound("shatter.mp3", audio.currentTime, 1);
	}

	update() {
		const target = Math.atan2(plr.y - this.y, plr.x - this.x);
		const angled = angle(this.rot, target);
		this.rot += ((angled > 0 && angled < 180) ? 0.2 : -0.2) + (Math.random() - 0.5) * 0.35;
		this.vx += Math.cos(this.rot) * 0.6;
		this.vy += Math.sin(this.rot) * 0.6;
		this.x += this.vx;
		this.y += this.vy;
		this.vx *= 0.9;
		this.vy *= 0.9;
		this.collision.x = this.x;
		this.collision.y = this.y;
		let inRange = collision(plrCollision, this.collision);
		if (((f - this.start) >= 600 && !this.boom) || inRange) {
			this.boom = true;
			this.collision.w = 128;
			this.collision.h = 128;
			const hit = collision(plrCollision, this.collision);
			if (hit) {
				dmg(35);
			}
			ss += 25;
			sound("shatter.mp3", audio.currentTime, 1.5);
		}
	}

	draw() {
		if (lastDraw !== "missile") {
			lastDraw = "missile";
		}
		if (!this.boom) {
			ctx.fillStyle = "#fff";
			ctx.strokeStyle = "#fff";
			rect(this.x, this.y, 24, 24, false, true);
		}
	}
}

let bulletValleyRot = 0;
class AttackBulletValley extends Attack {
	constructor() {
		super(2000);
		this.x = boss.x;
		this.y = boss.y;
		bulletValleyRot += 0.3 + Math.PI;
		this.rot = (Math.random() > 0.9) ? (Math.random() * Math.PI * 2) : bulletValleyRot;
		this.hitbox = { w: 8, h: 8, r: 0 };
	}

	update() {
		this.x += Math.cos(this.rot) * 4.5;
		this.y += Math.sin(this.rot) * 4.5;
		this.hitbox.x = this.x;
		this.hitbox.y = this.y;
		const hit = collision(plrCollision, this.hitbox);
		if (hit) {
			dmg(15);
		}
	}

	draw() {
		if (lastDraw !== "bulletvalley") {
			lastDraw = "bulletvalley";
			ctx.fillStyle = "#fff";
		}
		rect(this.x, this.y, 12, 12, false, true)
	}
}

class AttackCutter extends Attack {
	constructor(less) {
		super(300);
		this.sr = Math.random() * Math.PI * 2;
		this.er = this.sr + Math.random() * Math.PI * 0 + 20 * (Math.random() > 0.5 ? -1 : 1);
		this.amt = less ? 1 : Math.floor(Math.random() * 4 + 1);
		this.boom = false;
		const { x, y } = rp();
		this.x = plr.x + x * 160;
		this.y = plr.y + y * 160;
		this.hitboxes = [];
		for (let i = 0; i < this.amt; i++) {
			this.hitboxes[i] = { x: this.x, y: this.y, w: 5000, h: 96, r: 0 };
		}
	}

	update() {
		const t = (f - this.start) / 240;
		if (t < 1) {
			for (let i = 0; i < this.amt; i++) {
				this.hitboxes[i].r = (Math.PI / this.amt) * i + 8 / (t * 260 + 1) * this.er + this.sr;
			}
		}
		if (t >= 1 && !this.boom) {
			this.boom = true;
			let hit = false
			for (let i = 0; i < this.amt; i++) {
				if (collision(plrCollision, this.hitboxes[i])) hit = true;
			}
			if (hit) {
				dmg(40);
			}
			ss += 150;
			sound("shatter.mp3", audio.currentTime, 2);
		}
	}

	draw() {
		if (lastDraw !== "cutter") {
			lastDraw = "cutter";
		}
		const { x, y } = getWorldPosition(this.x, this.y);
		const t = (f - this.start) / 240;
		if (t > 1) {
			ctx.fillStyle = "#f55";
			const s1 = 1 - ease(14, (t - 1) * 3);
			const o = { h: s1 * 120, w: 5000 };
			for (let i = 0; i < this.amt; i++) {
				rotrect(this.hitboxes[i], o);
			}
		} else {
			ctx.fillStyle = "#fff";
			const s1 = ease(13, t);
			const s2 = ease(14, t);
			const o = { h: s1 * 96, w: s2 * 5000 };
			for (let i = 0; i < this.amt; i++) {
				rotrect(this.hitboxes[i], o);
			}
		}
	}
}

class AttackShatter extends Attack {
	constructor(i, ult) {
		const delay = ult ? 1 : 0.25;
		const length = ult ? 180 : 120;
		super(length + i * delay + 120);
		this.delay = delay;
		this.length = length;
		this.i = i;
		this.ult = ult;
		this.x = Math.random() * 4800 - 2400;
		this.y = Math.random() * 2400;
		this.boom = false;
	}

	update() {
		if (f >= (this.length + this.i * this.delay + this.start) && !this.boom) {
			this.boom = true;
			const s = this.ult ? 500 : 250;
			const hit = collision(plrCollision, { x: this.x, y: this.y, w: s, h: s, r: 0 });
			if (hit) {
				dmg(30);
			}
			const dist = Math.hypot(this.x - plr.x, this.y - plr.y) * 15;
			const vol = (1 / dist) * (this.ult ? 2400 : 400) * 5;
			ss += this.ult ? 5 : 1.5;
			sound("shatter.mp3", audio.currentTime, Math.min(vol, 3));

			for (let _ = 0; _ < 5; _++) {
				const { x, y } = rp();
				particles.add(new Particle({
					s: { x: this.x, y: this.y },
					e: { x: this.x + x * 200, y: this.y + y * 200 },
					ss: s * Math.random(), es: 0,
					easepos: 10, easesize: 10,
					l: Math.random() * 500 + 500,
					clr: "#f558"
				}));
			}
		}
	}

	draw() {
		if (lastDraw !== "shatter") {
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 1.5;
			lastDraw = "shatter";
		}
		const t = (f - this.start - this.i * this.delay) / this.length;
		const t2 = (f - this.start - this.i * this.delay - this.length) / 60;
		const s = this.ult ? 500 : 250;
		if (t > 0 && t < 1) {
			const rs1 = ease(14, t) * s;
			const rs2 = ease(5, t) * s;
			ctx.beginPath();
			rect(this.x, this.y, rs1, rs1, true, true);
			ctx.stroke();
			ctx.fillStyle = "#fff4";
			ctx.fill();
			ctx.fillStyle = "#fff";
			rect(this.x, this.y, rs2, rs2, false, true);
		} else if (t > 1) {
			ctx.fillStyle = "#f55";
			const rs1 = s - ease(14, t2) * s;
			rect(this.x, this.y, rs1, rs1, false, true);
		}
	}
}

window.particles = particles;

let atk = 0;
let ss = 0;

let attacks = new Set();
window.attacks = attacks;

let stopwatch = 0;

function physics() {
	f++;

	plr.hp += 1 / 120;
	plr.hp = Math.min(plr.hp, 100);

	ss *= 0.91;

	if (plr.iframes > 0) {
		plr.iframes--;
	}

	// player movement
	if (keysDown.has("Minus")) {
		camera.zoom /= 1.02;
		camera.zoom = Math.max(0.5, camera.zoom);
	}
	if (keysDown.has("Equal")) {
		camera.zoom *= 1.02;
		camera.zoom = Math.min(2, camera.zoom);
	}
	if (keysDown.has("KeyA")) {
		plr.vx -= 1;
	}
	if (keysDown.has("KeyD")) {
		plr.vx += 1;
	}
	if (keysDown.has("KeyW") || keysDown.has("Space")) {
		plr.vy += 0.5;
	}
	if (keysDown.has("KeyS")) {
		plr.vy -= 0.4;
	}
	if (plr.willDash && plr.dashCD <= 0) {
		plr.willDash = false;
		plr.dashCD = 180;
		plr.iframes = Math.max(plr.iframes, 25);
	}

	if (plr.dashCD > 0) {
		if (plr.dashCD > 165) {
			plr.vx = (25 - (180 - plr.dashCD)) * (plr.dashDir ? 1 : -1);
			particles.add(new Particle({
				s: { x: plr.x, y: plr.y },
				ss: 24, es: 24,
				sr: 3 / 2,
				easepos: 0, easesize: 0,
				l: 50,
				clr: "#fff8"
			}));
		}
		plr.dashCD--;
	}
	plr.vx *= 0.85;
	plr.x += plr.vx;
	plr.vy -= 0.2;
	plr.vy *= 0.95;
	plr.y += plr.vy;
	if (plr.y < 0 && plr.vy < 0) {
		plr.y = 0;
		plr.vy = 0;
	}
	if (plr.y > 2400 - 18 && plr.vy > 0) {
		plr.y = 2400 - 18;
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

	if (f % 12 === 0 && plr.vy !== 0) {
		const { x, y } = rp();
		let ox = (Math.random() - 0.5) * 24;
		particles.add(new Particle({
			s: { x: plr.x + ox, y: plr.y - 18 },
			e: { x: plr.x + ox + x * 24, y: plr.y - 54 - Math.abs(y) * 96 },
			ss: 10 * Math.random(), es: 0,
			easepos: 10, easesize: 10,
			l: Math.random() * 1000 + 1000,
			clr: "#fff"
		}));
	}

	let focus = 1;
	atk++;
	if (atk > 0) {
		atk = atk % 2800;
	}

	if (atk == 0 || atk == 120 || atk == 240 || atk == 360) {
		for (let i = 0; i < ((atk == 360) ? 50 : 125); i++) {
			attacks.add(new AttackShatter(i, atk == 360));
		}
	}
	for (let n = 600; n < 1200; n += 150) {
		if (atk == n) {
			attacks.add(new AttackCutter());
			attacks.add(new AttackCutter());
			break;
		}
	}
	let dist = 0;
	if (atk > 1400 && atk < 1950) {
		if (atk % 3 !== 0) attacks.add(new AttackBulletValley());
		focus = 0.001;
		dist += 200;
	}
	for (let n = 0; n < 10; n++) {
		if (atk == 2100 + n * 10) {
			attacks.add(new AttackMissile());
			break;
		}
	}
	boss.focus = lerp(boss.focus, focus, 0.01);

	boss.rotation += (Math.random() - 0.5) * 0.05;

	const targetx = plr.x + Math.cos(boss.rotation) * (320 + dist) + (Math.random() - 0.5) * 48;
	const targety = plr.y + Math.sin(boss.rotation) * (320 + dist) + (Math.random() - 0.5) * 48;
	boss.vx = lerp(boss.vx, (targetx - boss.x) * 0.1, 0.02 * focus);
	boss.vy = lerp(boss.vy, (targety - boss.y) * 0.1, 0.02 * focus);
	boss.x += boss.vx * focus;
	boss.y += boss.vy * focus;

	camera.x = plr.x + (Math.random() - 0.5) * ss;
	camera.y = plr.y + (Math.random() - 0.5) * ss;

	plrCollision.x = plr.x;
	plrCollision.y = plr.y;

	attacks.forEach(a => {
		a.update();
		if (a.expired) attacks.delete(a);
	})
}

const keyOverlay = [
	{ k: ['KeyW', 'Space'], p: [1, 1] },
	{ k: ['KeyA'], p: [0, 0] },
	{ k: ['KeyS'], p: [1, 0] },
	{ k: ['KeyD'], p: [2, 0] },
];

let lastFrame = performance.now();
let lastUpdate = 0;
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
				startMusic(audio.currentTime + 2);
				pepTalkInfo.line = 0;
				pepTalkInfo.closed = false;
				lastUpdate = performance.now();
				atk = -600;
				plr.hp = 100;
				plr.x = plr.y = plr.vx = plr.vy = 0;
				attacks.clear();
				stopwatch = 0;
			}
		}
	} else {
		while (true) {
			if (lastUpdate > performance.now()) break;
			lastUpdate += 1000 / 120;
			stopwatch += 1 / 120;
			physics();
		}

		if (plr.hp <= 0) {
			pepTalk = true;
			pepTalkInfo.lineStart = now + 1000;
			pepTalkInfo.content = dialogues.b;
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, width, height);

			stopMusic();
			stopAllSounds();
			sound('death.flac', null, 3);
		} else {
			const [width, height] = [main.width, main.height];
			const zoomMult = height / 720 * camera.zoom;

			const sizeMult = height / 2000;
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, width, height);
			ctx.fillStyle = "#fff";
			ctx.globalAlpha = (plr.iframes <= 0) ? 1 : (Math.sin(now / 75) * 0.25 + 0.5);
			rect(plr.x - 12, plr.y + 18, 24, 36);
			ctx.globalAlpha = 1;

			ctx.fillStyle = "#222";
			rect(plr.x - 1600, -18, 3200, 1600);
			ctx.fillStyle = "#333";
			rect(plr.x - 1600, -18, 3200, 2);
			ctx.fillStyle = "#444";
			for (let i = -50; i < 50; i++) {
				rect((Math.floor(plr.x / 54) + i) * 54 - 1, -18, 2, 16);
			}

			lastDraw = null;
			attacks.forEach(a => {
				a.draw();
			});

			ctx.fillStyle = "#f00";
			rect(boss.x - 12, boss.y + 18, 24, 36)

			ctx.save();
			ctx.beginPath();
			ctx.rect(0, 0, width, height)
			rect(-2400, 2400, 4800, 9600, true);
			ctx.clip('evenodd'); // why is it called this when it can be called invert
			ctx.globalAlpha = 0.25;
			ctx.fillStyle = "#48b";
			ctx.fillRect(0, 0, width, height);
			ctx.globalAlpha = 0.25 + Math.sin(performance.now() / 500) * 0.1;
			ctx.translate(width / 2, height / 2);
			ctx.rotate(Math.PI * 0.25);
			for (let i = -50; i < 50; i++) {
				ctx.fillRect(-width * 2, i * 100 * sizeMult + ((performance.now() / 2) % 100) * sizeMult, width * 4, 40 * sizeMult);
			}
			ctx.restore();
			ctx.beginPath();
			ctx.globalAlpha = 1;
			rect(-2400, 2400, 4800, 9600, true);
			ctx.strokeStyle = "#48b";
			ctx.lineWidth = height / 200;
			ctx.stroke();

			particles.forEach(v => {
				if (v.expired) particles.delete(v);
				else v.draw();
			});

			if (plr.hp <= 99) {
				const { x, y } = getWorldPosition({ x: plr.x, y: plr.y });
				const r = Math.PI * 0.5;
				ctx.lineWidth = 20 * sizeMult;
				ctx.strokeStyle = "#f55";
				ctx.beginPath();
				ctx.arc(x, y, 150 * sizeMult, -r, -r + plr.hp / 100 * 2 * Math.PI);
				ctx.stroke();
			}

			{
				const unit = 150 * sizeMult;
				ctx.strokeStyle = "#fff8";
				ctx.fillStyle = "#fff8";
				ctx.lineWidth = 5 * sizeMult;
				keyOverlay.forEach(b => {
					const [x, y] = b.p;
					ctx.beginPath();
					ctx.rect(unit * 0.05 + x * unit, height - unit * 0.95 - y * unit, unit * 0.9, unit * 0.9);
					ctx.stroke();
					let pressed = false;
					b.k.forEach(k => {
						if (keysDown.has(k)) pressed = true;
					});
					if (pressed) ctx.fill();
				})
			}
		}
	}

	ctx.globalAlpha = 1;
	ctx.fillStyle = "#fff";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const sizeMult = Math.floor(height / 40) / 24
	ctx.font = `${Math.floor(height / 40)}px pixel`;
	letter(stopwatch.toFixed(2), width / 2, sizeMult * 15, 0);
	ctx.textAlign = "left";
	if (keysDown.has("ControlLeft")) {
		letter(boss.focus.toFixed(2), sizeMult * 15, sizeMult * 15, 0);
	}

	clicked = false;

	requestAnimationFrame(draw);
}

draw();
