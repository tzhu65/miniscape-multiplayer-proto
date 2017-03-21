let uuid = require('uuid');

class World {

}

/**
 * interesting
 */
interface GameObject {
  position:{x:number, y:number};
}

class GameObject implements GameObject {
  public position:{x:number, y:number}

  constructor() {
    this.position = {
      x: 0,
      y: 0
    }
  }

}



class GameBoundedObject extends GameObject {
  constructor() {
    super();
  }
}




interface GameMovableObject extends GameObject {
  speed: number;
  dx: number;
  dy: number;
}

class GameMovableObject extends GameObject implements GameMovableObject {
  public speed: number;
  public dx: number;
  public dy: number;

  constructor() {
    super();
    this.speed = 0;
    this.dx = 0;
    this.dy = 0;
  }
}

interface GameCharacter {

}

class GameCharacter extends GameObject implements GameCharacter {
  constructor() {
    super();
  }
}

interface GamePlayer {
  id: string;
  character: GameCharacter;
}

class GamePlayer {

  public id: string;
  public character: GameCharacter;

  constructor() {
    this.id = uuid();
    this.character = new GameCharacter();
  }

}

export { GamePlayer }


class Point {

  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

}

class GObject {

  public name: string;

  constructor(name: string) {
    this.name = name;
  }

}

type Constructor<T> = new (...args: any[]) => T;

function Tagged<T extends Constructor<{}>>(Base: T) {
  return class extends Base {
    _tag: string;
    constructor(...args: any[]) {
      super(...args);
      this._tag = "";
    }
  }
}

const TaggedPoint = Tagged(Point);

let g = new GameBoundedObject();
console.log(g.position);
