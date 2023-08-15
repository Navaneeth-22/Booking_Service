const express = require('express');
const {ServerConfig} = require('./config');
const apiRoutes = require('./routes');
const CRON = require('./utils/common/cron-jobs');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));



app.use("/api",apiRoutes);

app.listen(ServerConfig.PORT, async () => {
    CRON();
    console.log(`Server is running on port ${ServerConfig.PORT}`)
});
