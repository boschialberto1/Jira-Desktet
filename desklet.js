const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Util = imports.misc.util;

// Import local libraries
imports.searchPath.unshift(GLib.get_home_dir() + "/.local/share/cinnamon/desklets/jira@alberto/lib");
const JiraUtility = imports.jira.JiraUtility;

const SEPARATOR_LINE = "\n\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\n";
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

function JiraDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

JiraDesklet.prototype = {
    success: false,
    failed: false,
    jiraData: null,
    descText: '',

    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);
        this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], desklet_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "height", "height", this.on_setting_changed);
		this.settings.bindProperty(Settings.BindingDirection.IN, "width", "width", this.on_setting_changed);
        this.setupUI();
        this.updateLoop();
    },

    on_setting_changed: function() {
        this.setupUI();
    },

    updateLoop() {
        this.getJiraTasks();
        this.updateID = Mainloop.timeout_add_seconds(60, Lang.bind(this, this.updateLoop));
    },


    setupUI: function() {
        // main container for the desklet
        this.window = new St.Bin();
        this.box = new St.BoxLayout({ vertical: true });
        this.vbox = new St.BoxLayout({ vertical: true });
        this.scrollbox = new St.ScrollView({
                          height: this.height,
                          width: this.width,
                          hscrollbar_policy: 2,
                          vscrollbar_policy: 1,
                          enable_mouse_scrolling: true
                        });
        let issuesCount = new St.Label({ text: 'Loading...' });
            issuesCount.style = 'font-size: 18px; margin-bottom: 10px';
if (this.jiraData) {

        for (let i = 0; i < this.jiraData.issues.length; i++) {

                    this.descText = '';
                    const issue = this.jiraData.issues[i];
    
                    const label = new St.Button({ label: issue.key });
                    label.style = 'padding-left: 5px; padding-right: 5px; font-weight: bold; background-color: mediumorchid;';
                    label.connect('clicked', Lang.bind(this, this.issueClicked))

                    const status = new St.Label({ text: issue.fields.status.name });
                    status.style = 'margin-left: 10px; color: white; background-color: lightgreen; font-weight: bold';

                    const labelBox = new St.BoxLayout({ vertical: false });
                    labelBox.add(label);
                    labelBox.add(status);

                    this.vbox.add(labelBox);

                    const descText = issue.fields.summary;

                    const description = new St.Label({ text: descText });
                    description.style = 'margin-top: 5px;';

                    this.vbox.add(description);
    
                    const separator = new St.Label({ text: "" });
                    separator.style = "border-top: 1px solid white; height: 0px; margin: 20px 0"
    
                    // box.add(label);
                    this.vbox.add(separator);
                }
            //this.text = new St.Label();
            //this.text.set_text("Hello, world!");
            issuesCount = new St.Label({ text: 'Total Issues: ' + this.jiraData.total + (this.loading ? ' (reloading...)' : '') });
            issuesCount.style = 'font-size: 18px; margin-bottom: 10px';

        }
        
        //this.vbox.add_actor(this.text);
        this.scrollbox.add_actor(this.vbox);
        this.box.add(issuesCount);
        this.box.add(this.scrollbox);
        this.window.add_actor(this.box);
        this.setContent(this.window);
    },
    issueClicked(btn) {
        const url = 'https://jira.rei-d-services.com/browse/' + btn.get_label();
        Debugger.log(url,2);
        Util.spawnCommandLine('xdg-open ' + url);
    },

    onDeskletFormatChanged() {
        this.setupUI();
    },

    /**
     * Called when user clicks on the desklet.
     */
    on_desklet_clicked(event) {
        global.logError(event.get_button());
        this.getJiraTasks();
    },

    getJiraTasks() {
        const jira = new JiraUtility();

        this.loading = true;
        this.setupUI();

        jira.getAssigned(this, function (resp) {
            if (resp) {
                this.loading = false;
                this.success = true;
                this.jiraData = JSON.parse(resp);
            } else {
                this.loading = false;
                this.failed = true;
            }

            this.setupUI();
        });
    }
}

function main(metadata, desklet_id) {
    return new JiraDesklet(metadata, desklet_id);
}
