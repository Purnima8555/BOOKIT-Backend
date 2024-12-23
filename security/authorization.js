const jwt = require("jsonwebtoken")

const SECRET_KEY = "21e6fb393716f568bf5ab155f62379812ac5b048efdea976aa1b1699f9e7e7dd";

function authenticateToken(req,res,next) {
    const token=req.header("Authorization")?.split(" ")[1];
    if(!token) {
        return res.status(401).send("Access denied: No token provided.")
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY)
        req.user=verified;
        next()
    } catch (e) {
        res.status(400).send("Invalid token")
    }
}

function authorizeRole(role) {
    return (req,res,next)=> {
        if(req.user.role!==role) {
            return res.status(403).send("Access Denied:Insufficient Permissions")
        }
        next();
    }
}

module.exports={authenticateToken, authorizeRole};