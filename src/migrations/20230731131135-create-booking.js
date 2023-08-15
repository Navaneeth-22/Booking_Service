'use strict';
/** @type {import('sequelize-cli').Migration} */
const { ENUMS } = require("../utils/common");
const { PENDING, CONFIRMED, CANCELLED } = ENUMS.BOOKING_STATUS;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bookingId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      showSeatId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      cinemaId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status : {
        type : Sequelize.ENUM(PENDING , CONFIRMED , CANCELLED),
        allowNull : false,
        defaultValue : "pending"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    // set unique constraint of seatId, showId, hallId, cinemaId
    await queryInterface.addConstraint('Bookings', {
      fields: ['bookingId','showSeatId', 'cinemaId'],
      type: 'unique',
      name: 'unique_booking'
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};