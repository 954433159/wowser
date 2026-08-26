import ServerConfig from './config';

ServerConfig.db.clear();
process.stdout.write(`\n> Settings deleted from ${ServerConfig.db.path}\n\n`);
