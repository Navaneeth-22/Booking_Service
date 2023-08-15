const axios = require('axios');
const {StatusCodes} = require('http-status-codes');

const { BookingRepository } = require('../repositories');
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const {ENUMS} = require('../utils/common');
const { PENDING,CONFIRMED, CANCELLED } = ENUMS.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
    const transaction = await db.sequelize.transaction();
    console.log(data)
    // query will have a set of seatIds 
    try {
        const showSeats = data.showSeatIds.map(seatId => `seatIds=${encodeURIComponent(seatId)}`).join('&');
        
        const showStatus = await axios.get(`http://localhost:3000/api/v1/show-service/status?${showSeats}&cinemaId=${data.cinemaId}&status=available`);
        console.log("Sksk",showStatus.data)
        const showStatusData = showStatus.data.data;
        if(showStatusData.length === 0) {
            throw new AppError('No seats found', StatusCodes.NOT_FOUND);
        }
        if(showStatusData.length !== data.showSeatIds.length) {
            throw new AppError('Some seats are not available', StatusCodes.NOT_FOUND);
        }
        
        await axios.patch(`http://localhost:3000/api/v1/show-service/status?${showSeats}&cinemaId=${data.cinemaId}&status=locked`);
        let price = 0;
        showStatusData.forEach((seat) => {
            price += seat.price;
        });
        data.price = price;
        const response = await bookingRepository.createBooking(data, transaction);
        await transaction.commit();
        return response;
    }
    catch(err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function makePayment(data) {
    // data will have bookingIds
    const transaction = await db.sequelize.transaction();
    console.log(data)
    try {
        const bookings = await bookingRepository.getBookingsById(data.bookingId,transaction);
        if(bookings.length === 0) {
            throw new AppError('No bookings found', StatusCodes.NOT_FOUND);
        }
        if(bookings[0].status === "CONFIRMED") {
            throw new AppError('Booking is already confirmed', StatusCodes.NOT_FOUND);
        }
        if(bookings[0].status === "CANCELLED") {
            throw new AppError('Booking expired', StatusCodes.NOT_FOUND);
        }
        const timeWhenBooked = new Date(bookings[0].createdAt);
        const timeNow = new Date();
        const diff = timeNow - timeWhenBooked;
        const diffInMinutes = Math.floor(diff / 60000); 
        if(diffInMinutes > 5) {
            await cancelBooking(data.bookingId);
            throw new AppError('Booking expired', StatusCodes.NOT_FOUND);
        }
        if(bookings[0].price !== data.price) {
            throw new AppError('Price mismatch', StatusCodes.NOT_FOUND);
        }
        if(bookings[0].userId !== data.userId) {
            throw new AppError('User mismatch', StatusCodes.NOT_FOUND);
        }
        const showSeatIds = bookings.map(booking => booking.showSeatId);
        const showSeats = showSeatIds.map(seatId => `seatIds=${encodeURIComponent(seatId)}`).join('&');
        await axios.patch(`http://localhost:3000/api/v1/show-service/status?${showSeats}&cinemaId=${data.cinemaId}&status=booked`);
        const response = await bookingRepository.updateBooking(data.bookingId, {status: CONFIRMED}, transaction);
        await transaction.commit();
        return response;
    }
    catch(err) {
        await transaction.rollback();
        console.log(err)
        throw err;
    }
}

async function cancelBooking(bookingId) {
    const transaction = await db.sequelize.transaction();
    try {
        const bookings = await bookingRepository.getBookingsById(bookingId, transaction);
        if(bookings.length === 0) {
            throw new AppError('No bookings found', StatusCodes.NOT_FOUND);
        }
        // get the status of all the bookings
        const status = bookings[0].status;
        if(status === CANCELLED) {
            await transaction.commit();
            return true;
        }
        const showSeats = bookings.map(booking => `seatIds=${encodeURIComponent(booking.showSeatId)}`).join('&');
        await axios.patch(`http://localhost:3000/api/v1/show-service/status?${showSeats}&cinemaId=${bookings[0].cinemaId}&status=available`);
        const response = await bookingRepository.updateBooking(bookingId, {status: CANCELLED}, transaction);
        await transaction.commit();
        return response;
    }
    catch(err) {
        await transaction.rollback();
        throw err;
    }
}

async function cancelOldBookings() {
        const time = new Date( Date.now() - 1000 * 300 ); // time 5 mins ago
        const transaction = await db.sequelize.transaction();
        try {
            const oldBookings = await bookingRepository.getOldBookings(time,transaction);
            console.log(oldBookings.length)
            if(oldBookings.length === 0) {
                await transaction.commit();
                return true;
            }

            const showSeatIds = oldBookings.map(booking => booking.showSeatId);
            const showSeats = showSeatIds.map(seatId => `seatIds=${encodeURIComponent(seatId)}`).join('&');
            const res = await axios.patch(`http://localhost:3000/api/v1/show-service/status?${showSeats}&status=available`);
            if(res.status !== 200) {
                throw new AppError('Not able to cancel the bookings', StatusCodes.INTERNAL_SERVER_ERROR);
            }

            await bookingRepository.cancelOldBookings(time,transaction);
            await transaction.commit();
        } 
        catch(err) {
            console.log(err)
            await transaction.rollback();
            throw err;
        }
}

module.exports = {
    createBooking,
    makePayment,
    cancelBooking,
    cancelOldBookings
}


