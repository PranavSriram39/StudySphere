const express = require("express");

const router = express.Router();
const { createOrg,joinOrg, getOrg, leaveOrg } = require("../controllers/orgController");
const protect = require('../middlewares/authMiddleware');


// router.post("/create-org", createOrg);

router.route("/create-org").post(protect,createOrg);
router.route("/join-org").post(protect,joinOrg);
router.route("/leave-org").post(protect,leaveOrg);
router.route("/get-org").get(protect,getOrg);

module.exports = router;
