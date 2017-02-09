/**
 * Created by Nabeel on 2017-02-06.
 */
(function(exports) {
    var apibase = 'https://clicktime.herokuapp.com/api/1.0';
    var model = function() {
        this._userID;
        this._companyID;
        this._Clients = [];
        this._Jobs = [];
        this._Tasks = [];

        this.getClients = function () { return this._Clients };
        this.getJobs = function () { return this._Jobs };
        this.getTasks = function () { return this._Tasks };

        this.init = function() {
            var that = this;
            $.ajax(apibase + '/session', {
                dataType:'jsonp',
                success: function(response) {
                    //$('#email').html(response.UserEmail);
                    //$('#name').html(response.UserName);
                    this._userID = response.UserID;
                    this._companyID = response.CompanyID;
                }
            }).done(function() {
                //console.log(this._userID);
                //console.log(this._companyID);
                var basicUrl = '/Companies/' + this._companyID + '/Users/' + this._userID;
                // Pull all clients
                $.ajax(apibase + basicUrl + '/Clients', {
                    dataType:'jsonp',
                    success: function(response) {
                        response.forEach(function(item) {
                            that._Clients.push(item);
                        })
                    }
                });

                // Pull all jobs
                $.ajax(apibase + basicUrl + '/Jobs' + '?withChildIDs=true', {
                    dataType:'jsonp',
                    success: function(response) {
                        response.forEach(function(item) {
                            that._Jobs.push(item);
                        })
                    }
                });

                // Pull all tasks
                $.ajax(apibase + basicUrl + '/Tasks', {
                    dataType:'jsonp',
                    success: function(response) {
                        response.forEach(function(item) {
                            that._Tasks.push(item);
                        })
                    }
                });
            });
            this.notify(null);
        }
    };

    // Add observer functionality
    _.assignIn(model.prototype, {
        // Add an observer to the list
        addObserver: function(observer) {
            if(_.isUndefined(this._observers)) {
                this._observers = [];
            }
            this._observers.push(observer);
            observer(this, null);
            //console.log('observers: ', this._observers);
        },
        // Notify all the observers on the list
        notify: function(args) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            _.forEach(this._observers, function(obs) {
                obs(this, args);
            });
        }
    });

    var searchView = function(model) {
        // Functions
        this.updateView = function(obs, args) {

        };

        // Other stuff
        //var search = document.getElementById("search");
        //search.append('<input type="text" name="taskname">');
        //search.append('<button type="button">GO</button>');
        var clients = model.getClients();
        var jobs = model.getJobs();
        var tasks = model.getTasks();
        $('#search').append('<input type="text" name="taskname" id="task">');
        $('#search').append('<button type="button" id="searchButton">GO</button>');
        $('#searchButton').click(function() {
            var taskName = document.getElementById('task').value;
            if (taskName == '') {
                $("#results").empty();
                return;
            }
            $("#results").empty();
            var thisTaskID = 'NULL';
            // Find the TaskID
            tasks.forEach(function(task) {
                if (task.Name == taskName) {
                    thisTaskID = task.TaskID;
                }
            });
            // Find relevant jobs
            var found = false;
            if (thisTaskID != 'NULL') {
                // Means we actually have a valid task name
                // So search for all matching jobs
                jobs.forEach(function(job) {
                    var permitted = job.PermittedTasks.split(',');
                    if (_.includes(permitted, thisTaskID)) {
                        var resultName = 'Job: ' + job.Name + ', Client: ';
                        found = true;
                        clients.forEach(function(client) {
                            if (client.ClientID == job.ClientID) {
                                resultName += client.Name;
                            }
                        });
                        $("#results").append('<h1>' + resultName + '</h1>');
                    }
                });
            }

            if (!found) {
                // Means we found nothing
                $("#results").append('<h1> No jobs and clients found related to the task: '+ taskName +'</h1>');
            }
        });

        model.addObserver(this.updateView);
    };

    exports.startApp = function() {
        var Model = new model();
        Model.init();
        $(document).ajaxStop(function () {
            //console.log(Model.getClients());
            //console.log(Model.getJobs());
            //console.log(Model.getTasks());
            var sView = new searchView(Model);
        });
    }
})(window);