const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/getNBTFile', mid.requiresLogin, controllers.Nbt.getNBTFile);
  app.post('/downloadNBTFile', mid.requiresLogin, controllers.Nbt.downloadNBTFile);
  app.get('/getFileList', mid.requiresLogin, controllers.Nbt.getFileList);
  app.delete('/deleteFile', mid.requiresLogin, controllers.Nbt.deleteNbt);
  app.post('/saveNBT', mid.requiresLogin, controllers.Nbt.saveNBT);
  app.get('/main', mid.requiresLogin, controllers.Nbt.mainPage);
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;
