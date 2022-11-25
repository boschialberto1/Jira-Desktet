const Soup = imports.gi.Soup;

const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

var JiraUtility = function() {};

const IDEN = "jira@alberto";

const Debugger = {
    logLevel: 2,
    log: function (message, level) {
        if (!level) {
            level = 1;
        }
        if (level <= this.logLevel) {
            global.log(message);
        }
    }
};


JiraUtility.prototype.getAssigned = function (here, callback) {
    const url = "https://jira.rei-d-services.com/rest/api/latest/search?jql=(assignee=currentUser() AND project=C777BE AND status NOT IN (Done,Closed))";

    let message = Soup.Message.new('GET', url);
    let auth = new Soup.AuthBasic();

    auth.authenticate("jirausername", "jirapassword");

    message.request_headers.append("Authorization", auth.get_authorization(message));

    _httpSession.timeout = 10;
    _httpSession.idle_timeout = 10;
    _httpSession.queue_message(message, function (session, message) {
        if (message.status_code == 200) {
            try {
                callback.call(here, message.response_body.data.toString());
            } catch (e) {
                global.logError(IDEN + ': ERROR | ' + e.message);
                callback.call(here, null);
            }
        } else {
            global.logError(IDEN + ': BAD_API | ' + message.status_code + ' ' + here.atlassianDomain + " " + url);
        }
    });
};
