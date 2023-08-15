const express = require('express');
const router = express.Router();
const BookingRoutes = require("./booking-routes"); 
const {InfoController} = require("../../controllers")

router.get("/info",InfoController.info);
router.use("/booking",BookingRoutes);

module.exports = router;