const { configuration } = require("./constant");
const SystemEnum = require("./systemEnumModel");
// const user=require("mongoose").model("User")

const startup = async () => {
    
    const number = await SystemEnum.countDocuments();
    
    if (number == 0) {
        for (var i = 0; i < configuration.length; i++) {
            
            var configurationinfo = new SystemEnum(configuration[i]);
      configurationinfo
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
