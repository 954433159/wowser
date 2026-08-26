import express from 'express';
import logger from 'morgan';

import Pipeline from './pipeline';
import { staticRoot } from './paths';

class Server {

  constructor(port, root = process.cwd()) {
    this.port = port;
    this.root = root;

    this.app = express();

    this.app.set('root', this.root);
    this.app.use(logger('dev'));
    this.app.use(express.static(staticRoot(this.root)));
    this.app.use('/pipeline', new Pipeline().router);
  }

  start() {
    this.app.listen(this.port);
  }

}

export default Server;
