const { Admin } = require("./constant");
const user = require("../../api/admin/practitioner/models/userModel");
// const user=require("mongoose").model("User")
// console.log(Admin);

const startup = async () => {
  const number = await user.countDocuments({  userType: 1});
  // const des = await user.findOne({ userType: "Admin" });

  if (number == 0) {
    for (var i = 0; i < Admin.length; i++) {
      const admininfo = new user(Admin[i]);

      admininfo
        .save()
        .then(() => {})
        .catch((err) => {
          console.log(err);
        });
    }
  }
};

module.exports = startup;
