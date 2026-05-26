export const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();

    //options for cookie
   const potions = {
    expires: new Date(Date.now() + process.env.EXPIRE_COOKIE * 24 * 60 * 60 * 1000),
    httpOnly: true
   }

   res.status(statusCode).cookie("token", token, potions).json({
    success: true,
    user,
    token
   })
};