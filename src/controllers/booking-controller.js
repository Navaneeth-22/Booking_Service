const {StatusCodes} = require('http-status-codes');
const { Op } = require("sequelize");
const {BookingService} = require('../services');
const {SuccessResponse,ErrorResponse} = require('../utils/common');

async function createBooking(req, res, next) {
    try {

        const showSeatIds = JSON.parse(req.query.showSeatIds.replace(/'/g, "\""));

        const response = await BookingService.createBooking({
            userId : +req.body.userId,
            cinemaId : +req.body.cinemaId,
            showSeatIds : showSeatIds,
        });
        SuccessResponse.data = response;
        return res
                .status(StatusCodes.CREATED)
                .json(SuccessResponse);
    }
    catch(err) {
        ErrorResponse.error = err;
        return res
                .status(err.statusCode)
                .json(ErrorResponse);
    }
}

const MEMDB = {};

async function makePayment(req,res,next){
    console.log(MEMDB)
    try {
        const idempotencyKey = req.headers['x-idempotency-key'];
        if(!idempotencyKey){
            return res
            .status(StatusCodes.BAD_REQUEST)
            .json({message: 'Idempotency key not found'});

        }
        if(MEMDB[idempotencyKey]){
            return res
            .status(StatusCodes.BAD_REQUEST)
            .json({message: 'Payment already made'});

        }



        const response = await BookingService.makePayment({
            userId : +req.body.userId,
            cinemaId : +req.body.cinemaId,
            bookingId : req.body.bookingId,
            price : +req.body.price,
            
        });
        MEMDB[idempotencyKey] = response;
        SuccessResponse.data = response;
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
        
    } catch (error) {
        ErrorResponse.error = error;
        return res
                .status(error.statusCode)
                .json(ErrorResponse);
    }
}

module.exports = {
    createBooking,
    makePayment
};

