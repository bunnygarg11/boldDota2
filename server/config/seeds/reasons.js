const { allFlagReason } = require("./constant");
const FlagReason = require("../../api/admin/flagReasons/models/flagReasonModel");
// const user=require("mongoose").model("User")
// console.log(allFlagReason,"gy");

const startup = async () => {
    
    const number = await FlagReason.countDocuments();
    // const des = await user.findOne({ userType: "Admin" });
    
    if (number == 0) {
        for (var i = 0; i < allFlagReason.length; i++) {
            // console.log(allFlagReason[i]);
            
            var FlagReasoninfo = new FlagReason(allFlagReason[i]);
      FlagReasoninfo
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
