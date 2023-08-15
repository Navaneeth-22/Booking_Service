const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");

const { Booking } = require('../models');
const CrudRepository = require('./crud-repository');
const {ENUMS} = require('../utils/common');
const { PENDING,CONFIRMED,CANCELLED} = ENUMS.BOOKING_STATUS;
const uuid = require('uuid');


class BookingRepository extends CrudRepository {
    constructor() {
        super(Booking); 
    }

    async createBooking(data, transaction) {
        // data contains userId,cinemaId,array of [showSeatIds],status
        // create a booking for each showSeatId using inbuilt array methods and return the array of bookings
        const bookingId = data.userId  + uuid.v4();
        data.showSeatIds.forEach(async (showSeatId) => {
            await Booking.create({
                bookingId : bookingId,
                userId: data.userId,
                cinemaId: data.cinemaId,
                showSeatId: showSeatId,
                status: data.status,
                price: data.price
            }, {transaction: transaction});
        });
        const bookings = await Booking.findAll({
            where: {
                bookingId: bookingId
            }
        }, {transaction: transaction});
        return bookings;
        
    } 
    async getBookingsById(bookingId, transaction) {

        const response = await Booking.findAll({
            where: {
                bookingId : bookingId
            }
        }, {transaction: transaction});
        return response;
    }
    async get(data, transaction) {
        const response = await Booking.findByPk(data, {transaction: transaction});
        if(!response) {
            throw new AppError('Not able to fund the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }


    async updateBooking(bookingId, data, transaction) { // data -> {col: value, ....}
        const response = await Booking.update(data, {
            where: {
                bookingId : bookingId
            }
        }, {transaction: transaction});
        return response;
    }

    async getOldBookings(timestamp, transaction) {
        const oldBookings = await Booking.findAll({
            where: {
                [Op.and]: [
                    {
                        createdAt: {
                            [Op.lt]: timestamp
                        }
                    }, 
                    {
                        status: {
                            [Op.ne]: CONFIRMED
                        }
                    },
                    {
                        status: {
                            [Op.ne]: CANCELLED
                        }
                    }
                ]
            }
        }, {transaction: transaction});
        const extractedData = oldBookings.map(booking => booking.dataValues);
        return extractedData;
    }
    async cancelOldBookings(timestamp, transaction) {
        
        

        const response = await Booking.update({status: CANCELLED},{
            where: {
                [Op.and]: [
                    {
                        createdAt: {
                            [Op.lt]: timestamp
                        }
                    }, 
                    {
                        status: {
                            [Op.ne]: CONFIRMED
                        }
                    },
                    {
                        status: {
                            [Op.ne]: CANCELLED
                        }
                    }
                ]
                
            }
        }, {transaction: transaction}); 
    }
}

module.exports = BookingRepository;