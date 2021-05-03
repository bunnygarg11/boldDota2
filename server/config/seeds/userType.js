const { userType } = require("./constant");
const userTypeModel = require("../../api/admin/userType/models/userTypeModel");
// const user=require("mongoose").model("User")
// console.log(userType);

const startup = async () => {
    
    const number = await userTypeModel.countDocuments();
    // const des = await user.findOne({ userType: "Admin" });
    
    if (number == 0) {
        for (var i = 0; i < userType.length; i++) {
            var userTypeinfo = new userTypeModel(userType[i]);
      userTypeinfo
        .save()
        .then(() => {
        //   console.log("user done");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
};

module.exports = startup;
