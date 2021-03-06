const utils = require('../../helper/utils');
const apiUrls = require('../../api-url/page-2');

exports.paging = (req, pageNum) => {
  return utils.remoteGetJSON({
    url: `${apiUrls.personPaging}?pageNum=${pageNum}`,
    req
  });
};

exports.removePerson = (req, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        success: true
      });
    }, 300);
  });
};

exports.savePerson = (req, data) => {
  return utils.remotePostJSON({
    url: apiUrls.personSave,
    data,
    req
  });
};
