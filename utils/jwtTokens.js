export const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();

    // options for cookie
   const expires = new Date(Date.now() + (Number(process.env.EXPIRE_COOKIE) || 3) * 24 * 60 * 60 * 1000);

   // For cross-site requests (frontend hosted on a different domain), modern
   // browsers require `SameSite=None; Secure` to send cookies. Enable these in
   // production to allow the cookie to be sent from the deployed frontend.
   const potions = {
    expires,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
   };

   res.status(statusCode).cookie("token", token, potions).json({
    success: true,
    user,
    token
   });
};