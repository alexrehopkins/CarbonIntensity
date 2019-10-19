let actualIntensity = 208;
let stars = [];
let starCount = 30;
let bars;
let apiFound = 0;
let img;
let lat, lon, weather, data, intensity, maxC, minC, averageC, rating, apiData;
let hourlyIntensity;
let forecast;
let mode = 1; //0 = hours in a day, 1 = days in a week
let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let submitPos = 0;
let selectedBuildings = [];
let loaded = 0;
let url;
let loggedResults = [];

      /*const button = document.getElementById('submit');
      button.addEventListener('click', async event => {
        bars = document.getElementById('bars').value;
        const data = { intensity };
        const options = {
          method: 'POST', //data api from http://carbonintensity.org.uk/
          headers: { //You can also get the intensity on specific regions of the UK using postcodes
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
        const response = await fetch('/api', options);
        const json = await response.json();
        console.log(json);
      });*/
      
async function getWeather(){
	try {
	  	var currentday = new Date(); 
	  	var sunday = new Date();
	  	var saturday = new Date();
	  	var wd = currentday.getDay(); //weekday 0=sunday 1=monday so on.
	  	sunday.setDate(currentday.getDate()-wd);
	  	saturday.setDate(currentday.getDate()+(6-wd));
		if (mode == 0) {
			bars = 24;
			let mon = ("00"+(currentday.getMonth()+1)).slice(-2);
			let day = ("00"+(currentday.getDate())).slice(-2);
			let yer = currentday.getYear()+1900;
			url = "https://api.carbonintensity.org.uk/intensity/stats/"+yer+"-"+mon+"-"+day+"T00:00Z/"+yer+"-"+mon+"-"+day+"T24:00Z/1";
		}
		else if (mode == 1) {
			bars = 7;
			let mon = ("00"+(sunday.getMonth()+1)).slice(-2);
			let day = ("00"+(sunday.getDate())).slice(-2);
			let yer = sunday.getYear()+1900;
			let mon2 = ("00"+(saturday.getMonth()+1)).slice(-2);
			let day2 = ("00"+(saturday.getDate())).slice(-2);
			let yer2 = saturday.getYear()+1900;
			url = "https://api.carbonintensity.org.uk/intensity/stats/"+yer+"-"+mon+"-"+day+"T00:00Z/"+yer2+"-"+mon2+"-"+day2+"T24:00Z/24";
		}
		if (apiFound == 0) {
			for (let i = 0; i < bars; i++) {
				selectedBuildings[i] = 0;
				loggedResults[i] = 0;
			}
		}
		const response = await fetch(url);
		const weatherData = await response.json();
		apiData = weatherData.data;
		apiFound = 1;
		//intensity = apiData[0].intensity;
		//actualIntensity = intensity.actual;
		//rating = intensity.index;
		//document.getElementById('intensity').textContent = rating;
	} 
	catch(err) {
    	console.log(err);
  	}
}

function preload() {
  img = loadImage('submitTruck.png');
}

function setup() {
  	createCanvas(windowWidth, windowHeight);
  	noStroke();
  	img.loadPixels();
  	rectMode(CORNERS);
  	for(let i = 0; i < starCount; i++) {
    	stars.push(new star());
    	stars[i].construct(i);
  	}
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for(let i = 0; i < starCount; i++) {
    stars[i].construct(i);
  }
}

function draw() {
  	background(30,30,40);
  	for(let i = 0; i < 10; i++) {
    	fill(30+i*5,30,30+i*5)
    	rect(0,(i-1)*height/10,width,i*height/10+1);
  	}
  	for(let i = 0; i < starCount; i++) {
    	stars[i].draw(i);
  	}
  	if (loaded == 0) {
    	loadingScreen();
	}
	else {
  		if (apiFound == 1) {  
			barBuildings();
    		submit();
		}
  		else {
  			getWeather();  //change so it doesnt rerun every draw frame? Once every hour maybe?
  			recieveDatabase(); //get Database user logged results
    		textSize(100);
    		background(0);
    		text('LOADING',100,100);
  		}
  	}
}

function loadingScreen() {
	textSize(20);
	fill(20,0,20);
	rect(180,180,width-180,height-180);
	fill(250);
	text('Carbon Intensity levels in England Visualisation \n \n \n \nHeight of buildings correlates to general carbon intensity levels in England over the course of the week. \n \nClick on buildings relating to the days of the week where you have/expected to spend more than an hour this week, then click submit to log activity. \n \n \n \nClick anywhere to begin',200,200,width-400,height-400);
	if (mouseIsPressed) {
		loaded = 1;
	}
}

function submit() {
	if (submitPos != 0 && submitPos < width*2) {
		submitPos += 3;
	}
	if (mouseX < 200 && mouseY > (height-100) && submitPos == 0) {
		if (mouseIsPressed) {
			console.log("SUBMITTED");
			submitPos = 1;
			sendData();
		}
		image(img, 0, height-110, 220, 110);
	}
	else {
		image(img, submitPos, height-100+((submitPos/6)%3), 200, 100);
	}
}

async function sendData() {
    const data = { selectedBuildings, url };
    const options = {
      	method: 'POST',
      	headers: {
        	'Content-Type': 'application/json'
      	},
      	body: JSON.stringify(data)
    };
    const response = await fetch('/api', options);
    const json = await response.json();
    console.log(json);
}

async function recieveDatabase() {
    try {
    	const response = await fetch('/api');
    	const data = await response.json();
	    for (let k = 0; k < data.length; k++) {
	    	for (let i = 0; i < data[k].selectedBuildings.length; i++) {
	    		if (data[k].selectedBuildings[i] < 0 && data[k].selectedBuildings.length == bars) {
	    			loggedResults[i] += 1;
	    		}
	    	}
	    }
	}
	catch(err) {
		console.log(err);
	}
} 

function barBuildings() {
  for (let j = 0; j < bars; j++) {
    hourlyIntensity = apiData[j].intensity.average;
    if (hourlyIntensity == null) {
    	hourlyIntensity = apiData[(j*2)+1].intensity.forecast;
    	if (forecast == 0) {
    		forecast = j;
    	}
    	if ((j+1) == bars && forecast == 0) {
    		forecast = j+1;
    	}
    } else {
    	forecast = 0;
    }
    fill(10,0,10);
    selectTimes(j);
    if (selectedBuildings[j] < 0) {
    	fill(100,0,10);
    }
    rect(j*windowWidth/bars,height,(((j+1)*windowWidth/bars))+1,height-height*(hourlyIntensity/500));
    push();
    rectMode(CORNER);
    for (let w = 0; w < 30; w++) {
    	fill((w*2)+10,w,(w*2)+10);
    	rect(((j)*width/bars)+10,height-height*(hourlyIntensity/500)+15+20*(w+1),(width/bars)-20,10);
    	fill(230-w,200-w,230-w);
    	if (w < loggedResults[j]) {
    		rect(((j)*width/bars)+10,height-height*(hourlyIntensity/500)+15+20*(w+1),((width/bars)-20)*0.2,3);
    	}
    }
    fill(230,200,230);
    textSize(13);
    rectMode(CORNERS);
    if (mode == 0) {
    	text(j+":00",((j)*width/bars)+10,height-height*(hourlyIntensity/500)+10,width/bars,50);
    }
    else if (mode == 1) {
    	text(weekdays[j],((j)*width/bars)+10,height-height*(hourlyIntensity/500)+10,width/bars,50);
    }
    pop();
  }
}

function selectTimes(jo) {
	if (mouseX > jo*windowWidth/bars && mouseX < (((jo+1)*windowWidth/bars))+1 && submitPos == 0 && mouseY < (height-100) && mouseY > height-height*(hourlyIntensity/500)) {
		if (mouseIsPressed && selectedBuildings[jo] < 1 && selectedBuildings[jo] > -2) {
			if (selectedBuildings[jo] == 0) {
				selectedBuildings[jo] = -50;
			}
			else if (selectedBuildings[jo] == -1) {
				selectedBuildings[jo] = 50;
			}
		}
		hourlyIntensity = hourlyIntensity*1.03;
	}
	if (selectedBuildings[jo] > 0) {
		selectedBuildings[jo]--;
	}
	if (selectedBuildings[jo] < -1) {
		selectedBuildings[jo]++;
	}
}



class star{
  construct() {
    this.starPos = [random(0,width),random(0,height/3)];
    this.flicker = 0;
    this.size = random(0,5);
  }
  draw() {
    fill(250);
    this.flicker += random(0,0.5);
    if (this.flicker > 5) {
      this.flicker = 0;
    }
    ellipse(this.starPos[0],this.starPos[1],this.size+this.flicker)

    //building
    fill(map(this.starPos[1],0,height/2,45,0),map(this.starPos[1],0,height/2,25,0),map(this.starPos[1],0,height/2,45,0)         );
    //fill(60-(this.starPos[1]-height/2)/4,0,60-(this.starPos[1]-height/2)/4);
    rect(this.starPos[0],this.starPos[1]+height/4,this.starPos[0]+(this.size+5)*10,height);

  }
}