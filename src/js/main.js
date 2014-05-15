(function(global, $) {
  'use strict';

  global.cancelRequestAnimFrame = (function() {
    return (
      global.cancelAnimationFrame ||
      global.webkitCancelRequestAnimationFrame ||
      global.mozCancelRequestAnimationFrame ||
      global.oCancelRequestAnimationFrame ||
      global.msCancelRequestAnimationFrame ||
      global.clearTimeout
    );
  }());

  global.requestAnimFrame = (function() {
    return (
      global.requestAnimationFrame ||
      global.webkitRequestAnimationFrame ||
      global.mozRequestAnimationFrame ||
      global.oRequestAnimationFrame ||
      global.msRequestAnimationFrame ||
      function(callback) {
        return global.setTimeout(callback, 1e3 / 60);
      }
    );
  }());

  var document = global.document,
      canvas,
      context,
      hitSound = document.getElementById('hit');
  
  var Scene = {
    width: null,
    height: null,
    colors: {
      first: null,
      second: null
    },
    scores: {
      first: 0,
      second: 0
    },
    setSize: function(width, height) {
      this.width = width;
      this.height = height;
      // Set canvas sizes
      canvas.width = this.width;
      canvas.height = this.height;

      return this;
    },
    setScoreColors: function(obj) {
      this.colors.first = obj.first;
      this.colors.second = obj.second;

      return this;
    },           
    setScore: function(number, score) {
      this.scores[number] = score;

      return this;
    },
    drawScore: function() {
      var x1 = this.width / 2 - (this.width / 2 * .5),
          y = this.height * 0.2,
          x2 = this.width / 2 + (this.width / 2 * .5);

      // Set players score
      context.font = 'bold 10em times';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillStyle = '#000';
      context.fillText(this.scores.first - 1, x1, y);
      context.fillText(this.scores.second - 1, x2, y);
      context.fillStyle = this.colors.first;
      context.fillText(this.scores.first, x1, y);
      context.fillStyle = this.colors.second;
      context.fillText(this.scores.second, x2, y);
    }
  };

  var Player = function(position, color, isAI) {
    var coords = {
      x: canvas.width / 2,
      y: 0
    };

    this.isAI = isAI || false;
    this.score = 0;
    this.color = color;
    this.speed = canvas.width * .02;
    this.width = canvas.width * .15;
    this.height = canvas.height * .02;
    this.moving = false;

    // Set to the center position
    coords.x -= this.width / 2;

    // Top, bottom
    this.position = position;
    context.fillStyle = this.color;

    this.remove = function() {
      context.clearRect(coords.x - 1, coords.y - 1, this.width + 2, this.height + 2);
    };

    switch (this.position) {
      case 'top':
        coords.y = 0;
        break;
      case 'bottom':
        coords.y = canvas.height - this.height;
        break;
    }

    this.getX = function() {
      return coords.x;
    };

    this.getY = function() {
      return coords.y;
    };

    this.draw = function() {
      context.fillStyle = this.color;
      context.fillRect(coords.x, coords.y, this.width, this.height);

      return this;
    };
    
    this.aiMoving = function(ballX, ballSpeed) {
      var center = this.getX() + this.width / 2;

      if (this.isAI) {
        this.speed = ballSpeed * .85;
        if (center > ballX) {
          this.move('left');
        } else if (center < ballX) {
          this.move('right');
        }
      }
    };

    this.move = function(direction) {
      this.remove();
      if (direction === 'left') {
        coords.x = Math.max(0, this.getX() - this.speed);
      } else if (direction === 'right') {
        coords.x = Math.min(this.getX() + this.speed, canvas.width - this.width);
      }
      this.draw();

      return this;
    };

    return this;
  };

  var Ball = {
    speed: null,
    startAngle: [45, -45, 15, -15, 195, -195, 250, -250],
    angle: null,
    x: null,
    y: null,
    radius: null,
    color: null,
    init: function() {
      if (this.x && this.y) {
        context.clearRect(this.x - this.radius - 1,
            this.y - this.radius - 1, this.radius * 2 + 2, this.radius * 2 + 2);
      }
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.radius = canvas.width / canvas.height * 5;
      this.speed = canvas.width * .007;
      this.angle = this.startAngle[Math.floor(Math.random() * this.startAngle.length)];

      return this;
    },
    setColor: function(color) {
      this.color = color;
      return this;
    },
    moving: function() {
      var radians,
          xUnits,
          yUnits;

      // Set the reflection
      if (this.x > canvas.width || this.x < 0 ) {
        this.angle = 180 - this.angle;
      }

      radians = this.angle * Math.PI / 180,
      xUnits = Math.cos(radians) * this.speed,
      yUnits = Math.sin(radians) * this.speed;

      context.clearRect(this.x - this.radius - 1,
          this.y - this.radius - 1, this.radius * 2 + 2, this.radius * 2 + 2);

      this.y += yUnits;
      this.x += xUnits;

      this.draw();
    },
    draw: function() {
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true); 
      context.closePath();
      context.fill();

      return this;
    }
  };

  global.PongGame = function(canvasID) {
    var timer,
        action,
        playSound = function() {
          hitSound.play();
          hitSound.currentTime = 0;
        };

    canvas = document.getElementById(canvasID);
    context = canvas.getContext('2d');

    this.scene = Scene;
    this.ball = Ball;

    this.scene
      .setSize(global.screen.availWidth * .4, global.screen.availHeight * .4)
      .setScoreColors({
        'first': '#fff',
        'second': '#ff0'
      })
      .setScore('first', 0)
      .setScore('second', 0)
      .drawScore();

    this.ball
      .setColor('#f00')
      .init()
      .draw();

    this.ai = new Player('top', '#ff0', true).draw();
    this.player = new Player('bottom', '#fff').draw();

    $(document)
      .on('keydown', function(event) {
        if (event.keyCode === 39) {
          this.player.move('right');
        } else if (event.keyCode === 37) {
          this.player.move('left');
        }
      }.bind(this));

    action = function() {
      var distance,
          touching = function(ball, player, reflection) {
            var y;

            if (ball.x >= player.getX() && ball.x <= player.getX() + player.width) {
              y = player.getY();
              if (player.isAI) {
                y += player.height;
              }
              distance = Math.abs(parseInt(y - ball.y, 10));

              if (distance - ball.radius < 2) {
                ball.angle = reflection - ball.angle;
                playSound();
                return true;
              }
            }

            return false;
          };

      if (!touching(this.ball, this.player, 360)) {
        touching(this.ball, this.ai, 360);
      }

      if ((this.ball.y - this.ball.radius) <= 0) {
        this.scene.setScore('first', ++this.scene.scores.first);
        this.ball.init();
      } else if ((canvas.height - this.ball.y) <= this.ball.radius) {
        this.scene.setScore('second', ++this.scene.scores.second);
        this.ball.init();
      }

      this.ball.moving();
      this.ai.aiMoving(this.ball.x, this.ball.speed);
      this.scene.drawScore();

      timer = requestAnimFrame(action);
    }.bind(this);

    return {
      'start': action,
      'stop': function() {
        if (timer) {
          cancelRequestAnimFrame(timer);
        }
      }
    };
  };
}(this, this.Zepto));
