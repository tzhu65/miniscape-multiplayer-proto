let socketCluster = require("socketcluster-client");
let scCodecMinBin = require("sc-codec-min-bin");
import * as Q from "q";

class Main extends Phaser.State {

  cursors : any;
  player: any;
  wasd: any;
  platforms: any;
  socket: any;
  players:any;
  movement:any;

  public preload() {
    console.log("main preload");
    let options = {
      hostname: 'localhost',
      port: 8000,
      codecEngine: scCodecMinBin
    }
    this.socket = socketCluster.connect(options);
    console.log('old socket id', this.socket.id);

    let _this = this;
    this.players = {};
    this.socket.on('connect', function() {
      _this.customCreate();
    });

  }

  public customCreate() {
    console.log('custom create');
    this.player = this.game.add.sprite(this.game.width/2, this.game.height/2, 'isaac');
    this.players[this.socket.id] = this.player;
    this.game.physics.arcade.enable(this.player);

    let _this = this;
    let playerName = "user-" + Math.round(Math.random() * 10000);

    this.socket.on('joinedWorld', function(positionData:any) {
      console.log(positionData);
      _this.player.position.x = _this.game.width * positionData.x;
      _this.player.position.y = _this.game.height * positionData.y;
    });
    this.socket.emit("joinWorld", {
      name: playerName
    });
    this.socket.emit("getWorldData", null);
    this.socket.on("gotWorldData", function(worldData:any) {
      console.log('got world data');
      for (let pid in worldData) {
        if (!worldData.hasOwnProperty(pid)) continue;
        if (pid != _this.socket.id) {
        console.log('adding another player');
          let p = worldData[pid];
          let player = _this.game.add.sprite(_this.game.width*p.position.x, _this.game.height*p.position.y, 'isaac');
          _this.players[pid] = player;
          console.log(_this.players);
          console.log(pid);
          console.log('strange pid');
        }
      }
      console.log(worldData);
    });


    this.player.body.collideWorldBounds = true;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.stage.backgroundColor = "#cecece";

    this.platforms = this.game.add.group();
    this.platforms.enableBody = true;

  }

  public create() {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.game.input.keyboard.addKey(Phaser.Keyboard.W),
      s: this.game.input.keyboard.addKey(Phaser.Keyboard.S),
      a: this.game.input.keyboard.addKey(Phaser.Keyboard.A),
      d: this.game.input.keyboard.addKey(Phaser.Keyboard.D),
    };
    this.movement = {
      x: 0,
      y: 0
    };

    let _this = this;


  //   for (var i=100; i<this.game.world.height - 50; i+=50){
  //     var wall = this.platforms.create(i, 50, 'ground');
  //     wall.body.immovable = true;
  //     wall = this.platforms.create(50, i, 'ground');
  //     wall.body.immovable = true;
  //     wall = this.platforms.create(this.game.world.height - 50, i, 'ground');
  //     wall.body.immovable = true;
  //     wall = this.platforms.create(i, this.game.world.height - 50, 'ground');
  //     wall.body.immovable = true;
  //   }

    let updateChannel = this.socket.subscribe('tickUpdate');
    let playerLeftChannel = this.socket.subscribe('playerLeft');
    let newPlayerChannel = this.socket.subscribe('newPlayer');

    updateChannel.watch(function(worldData:any) {
      // console.log(_this.players);
      for (let pid in worldData) {
        if (!worldData.hasOwnProperty(pid)) continue;
        let p = worldData[pid];
        let player = _this.players[pid];

        // console.log(p);
        // console.log(player);

        //  console.log(player, p);

        player.position.x = p.position.x * _this.game.width;
        player.position.y = p.position.y * _this.game.height;
      }
    });
    playerLeftChannel.watch(function(pid:any) {
      console.log('player left');
      console.log(_this.players, pid);
      if (_this.players[pid])
        _this.players[pid].destroy();
      delete _this.players[pid];
    });
    newPlayerChannel.watch(function(player:any) {
      if (_this.socket.id != player.id) {
        console.log('new player');
        let phaserPhaser = _this.game.add.sprite(_this.game.width*player.position.x, _this.game.height*player.position.y, 'isaac');
        _this.players[player.id] = phaserPhaser;
      }
    });

    let updatesPerSecond = 20;
    let updatePlayerInterval = setInterval(function() {
      _this.socket.emit("updatePlayer", _this.movement);
    }, 1000/updatesPerSecond);
  }

  public update() {

    if (this.player)
      var hitPlatform = this.game.physics.arcade.collide(this.player, this.platforms);

    // this.player.body.velocity.x = 0;
    // this.player.body.velocity.y = 0;
    if (this.wasd.a.isDown){
      // this.player.body.velocity.x = -500;
      this.movement.x = -1;
    }
    else if (this.wasd.d.isDown){
      // this.player.body.velocity.x = 500;
      this.movement.x = 1;
    } else {
      this.movement.x = 0;
    }
    if (this.wasd.w.isDown){
      // this.player.body.velocity.y = -500;
      this.movement.y = -1;
    }
    else if (this.wasd.s.isDown){
      // this.player.body.velocity.y =  500;
      this.movement.y = 1;
    } else {
      this.movement.y = 0;
    }
  }

}

export default Main;
