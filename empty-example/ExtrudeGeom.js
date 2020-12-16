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