'use strict';
const {
  Model
} = require('sequelize');
const {ENUMS} = require("../utils/common");
const {PENDING , CONFIRMED , CANCELLED} = ENUMS.BOOKING_STATUS;
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init({
    bookingId: {
      type : DataTypes.STRING,
      allowNull : false,
    },
    showSeatId: {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    cinemaId: {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    userId: {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    price: {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    status: {
      type : DataTypes.ENUM(PENDING , CONFIRMED , CANCELLED),
      allowNull : false,
      defaultValue : PENDING
    },
    // SET UNIQUE CONSTRAINT OF seatId, showId, hallId, cinemaId to prevent double booking
    
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};