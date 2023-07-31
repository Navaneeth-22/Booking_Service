const {StatusCodes} = require('http-status-codes');

const info = (req,res) => {
    return res.status(StatusCodes.OK).json({
        success : true,
        message : 'V1 API IS LIVE',
        error : {},
        data :{}
    })
}

module.exports = {
    info
}