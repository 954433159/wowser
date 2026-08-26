import Cluster from './cluster';
import ServerConfig from './config';

ServerConfig.verify().then(() => {
  const cluster = new Cluster();
  cluster.start();
});
