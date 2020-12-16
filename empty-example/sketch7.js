class ExtrudeGeom {
	constructor(id, renderer) {
		this.renderer = renderer;
		this.id = id;
		
		this.easeSpeed = 3;
		this.total = 40;
		this.easy = [];
		for(var i = 0; i < this.total; i++) {
			this.easy[i] = sqrt(i / this.total) / this.easeSpeed;
		}
		
		this.init();
	}
	
	init(){
		this.points = [];
		this.angle = -HALF_PI;
		this.speed = 6;
		this.loopCount = 0;
		this.lifeSpan = random(100, 1000);
		this.initialLifeSpan = this.lifeSpan;
		for(var i = 0; i < this.total; i++) {
			this.points[i] = new p5.Vector(i, 0, 1);
		}
		
		//pre-calculate rotation
		var pitch = random(TWO_PI);//rotateX;
		var yaw = random(TWO_PI);//rotateY;
		var roll = random(TWO_PI);//rotateZ;

		var cosa = Math.cos(yaw);
		var sina = Math.sin(yaw);

		var cosb = Math.cos(pitch);
		var sinb = Math.sin(pitch);

		var cosc = Math.cos(roll);
		var sinc = Math.sin(roll);

		this.Axx = cosa*cosb;
		this.Axy = cosa*sinb*sinc - sina*cosc;
		this.Axz = cosa*sinb*cosc + sina*sinc;

		this.Ayx = sina*cosb;
		this.Ayy = sina*sinb*sinc + cosa*cosc;
		this.Ayz = sina*sinb*cosc - cosa*sinc;

		this.Azx = -sinb;
		this.Azy = cosb*sinc;
		this.Azz = cosb*cosc;
  }

	generate(){
		this.lifeSpan--;
		if(this.points[this.points.length-1].z < 1)
			this.init();
		
		for(var i = this.points.length-1; i >= 1; i--)
			this.points[i].z = this.points[i-1].z;
		if(this.points[0].z > 0)
			this.points[0].z = this.lifeSpan/this.initialLifeSpan*100;
		
		if(this.loopCount == 0 && random(100) < 1)
			this.loopCount = 100;
		if(this.loopCount > 0) {
			this.loopCount--;
			this.angle += TWO_PI/100;
		}
		
		this.angle += (noise(this.id + frameCount/100)-0.55) / 10;
		this.points[0].x += cos(this.angle) * this.speed;
		this.points[0].y += sin(this.angle) * this.speed;
		
		for(var i = 1; i < this.points.length; i++) {
			this.points[i].x += (this.points[i-1].x - this.points[i].x) * this.easy[i];
			this.points[i].y += (this.points[i-1].y - this.points[i].y) * this.easy[i];
		}
		
		let context = this;

		//create a geometry
		this.geometry = new p5.Geometry(0, 0, function() {
			//extrude the points described earlier
			context.points.forEach(p => this.vertices.push(p.copy()))
			context.points.forEach(p => this.vertices.push(new p5.Vector(p.x, p.y, -p.z)))
			
			var total = this.vertices.length;
			this.vertices.forEach((vertex, index) => {
				var px = vertex.x;
				var py = vertex.y;
				var pz = vertex.z;

				//rotate points
				vertex.x = context.Axx*px + context.Axy*py + context.Axz*pz;
				vertex.y = context.Ayx*px + context.Ayy*py + context.Ayz*pz;
				vertex.z = context.Azx*px + context.Azy*py + context.Azz*pz;
				
				var uvX = index%(total/2)/(total/2);
				var uvY = floor(index/(total/2));
				uvX = uvX/(context.easy[floor(uvX*context.easy.length)] * context.easeSpeed);
				this.uvs.push([uvX, uvY])
			})

			//create the faces based on the extrude logic
			let n = context.points.length;
			for (var i = 0; i < n-1; i++) {
					this.faces.push([i + n, i + n + 1, i])
					this.faces.push([i + 1, i, i + n + 1])
			}
		})

		this.geometry.computeNormals()
		//this.geometry._makeTriangleEdges()
		if (this.renderer._doStroke)
			this.geometry._edgesToVertices()
		this.renderer.createBuffers("!" + this.id, this.geometry)
	}

	draw() {
		this.generate()
		this.renderer.drawBuffersScaled("!" + this.id, 1, 1, 1)
	}
}

let geoms

let messageCanvases
let geometry
let size

// 重力大小
const GRAVITY = 0.6;
// 相邻两句话之间的空格数量
const BLANK_LEN = 3;
// 字体大小
const TEXT_SIZE = 30;
// 字体名称 (将字体文件放置在当前目录下)
const FONT_NAME = '方正古仿简.TTF';
// 每个流的最多字数 (超出后最早出现的会被删除，节省内存)
const BUFFER_LEN = 50;
// 每个流的横向偏移量
const STREAM_OFFSET_X = [350, 600, 850];
// 所有流的纵向偏移量
const STREAM_OFFSET_Y = 400;
// 地面的纵向偏移量
const FLOOR_OFFSET_Y = 1000;
// 文字出现位置的横向不确定度
const BIRTH_PLACE_UNCERTAINTY_X = 6;
// 文字出现位置的旋转角不确定度
const BIRTH_PLACE_UNCERTAINTY_ANGLE = 0.01;
// 是否正序出现一句话
const FIRST_WORD_FIRST_OUT = true;

const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;

// 经过的帧数
let t = 0;
// 文本数据库
let db;
// 字体
let font1;
// 世界 (see Matter.js Doc)
let world;

// 文字流 (类型为 Generator，每次可获得一个字)
let streams = [];
// 缓冲区
let buffers = [];

let message = "难怪你清男生都如此饥渴 让我日常恐男"

function preload() {
	db = loadJSON('db.json');
	font = loadFont(FONT_NAME);
	font1 = loadFont(FONT_NAME);
}

function setup() {
	renderer = createCanvas(windowWidth, windowHeight, WEBGL);
	geoms = [];
	for(var i = 0; i < 20; i++) {
		geoms[i] = new ExtrudeGeom(i, renderer);
	}
	textFont(font1);
	fill(255);

	messageCanvases = []
	if (FIRST_WORD_FIRST_OUT) {
		for (let i = 0; i < Object.keys(db).length; i++) {
			const strArr = Array.from(db[i]);
			//strArr.reverse();

			db[i] = strArr;
		}
	}
	message.split(" ").forEach(word => {
		var messageCanvas = createGraphics(word.length*40, 32);
		messageCanvas.pixelDensity(4);
		messageCanvas.textSize(38);
		messageCanvas.textFont(font);
		messageCanvas.textAlign(CENTER, CENTER);
		messageCanvas.fill(255);
		messageCanvas.text(word, messageCanvas.width/2, messageCanvas.height/3.2);
		messageCanvases.push(messageCanvas);
	})


	

	for (let i = 0; i < 5; i++) {
		streams.push(getStream());
		buffers.push([]);
	}

	const engine = Engine.create();
	world = engine.world;
	world.gravity.y = GRAVITY;
	World.add(world, Bodies.rectangle(0, FLOOR_OFFSET_Y, 3000, 500, {
		isStatic: true
	}));

	// run the engine
	Engine.run(engine);
}

function* getStream() {
	const getNewIndex = () => {
		return Math.floor(Math.random() * Object.keys(db).length);
	};

	let curSentenceIndex = getNewIndex();
	let curWordIndex = db[curSentenceIndex].length - 1;
	let curCooldown = 0;

	while (true) {
		if (curWordIndex < 0) {
			curSentenceIndex = getNewIndex();
			curWordIndex = db[curSentenceIndex].length - 1;
			curCooldown = BLANK_LEN;
		}
		if (curCooldown) {
			yield ' ';
			curCooldown --;
		} else {
			yield db[curSentenceIndex][curWordIndex];
			curWordIndex --;
		}

	}
}
function drawRectangle(k) {
	const offsetX = STREAM_OFFSET_X[k];
	const offsetY = STREAM_OFFSET_Y;
	rect(offsetX - 100, 200, 200, 300);

}

function drawStream(k) {
	const stream = streams[k];
	const buffer = buffers[k];
	const offsetX = STREAM_OFFSET_X[k];
	const offsetY = STREAM_OFFSET_Y;

	if (!buffer.length || buffer[0][1].position.y - offsetY > TEXT_SIZE) {
		const box = Bodies.rectangle(offsetX + (Math.random() - 0.5) * BIRTH_PLACE_UNCERTAINTY_X, offsetY, TEXT_SIZE, TEXT_SIZE);
		box.angle = BIRTH_PLACE_UNCERTAINTY_ANGLE * (Math.random() - 0.5);
		World.add(world, box);
		buffer.unshift([stream.next().value, box]);
	}

	if (buffer.length >= BUFFER_LEN) {
		World.remove(world, buffer[buffer.length - 1][1]);
		buffer.pop();
	}

	for (let i = 0; i < buffer.length; i++) {
		const box = buffer[i][1];
		const position = box.position;
		const angle = box.angle;
		push();
		translate(position.x, position.y);
		rotate(angle);
		// fill(255);
		// rect(-TEXT_SIZE / 2, -TEXT_SIZE / 2, TEXT_SIZE, TEXT_SIZE);
		text(buffer[i][0], -TEXT_SIZE / 2, TEXT_SIZE / 2);
		pop();
	}
}

function draw() {
    background(0);
  	orbitControl()
	textSize(TEXT_SIZE);
	
  	t++;

  	for (let i = 0; i < 3; i++) {
  		//fill(105);
  		//drawRectangle(i);
  		fill(255);
  		//drawStream(i);
  		for(let i = 0; i < geoms.length; i++) {
		texture(messageCanvases[i%messageCanvases.length]);
		geoms[i].draw();
	}
  		
  	}
}
