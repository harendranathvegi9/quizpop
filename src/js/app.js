(function(window, m, localforage, undefined) {

  var User = function(data) {
    this.username = m.prop(data.username);
    this.free = m.prop(data.account_type);
    this.photo = m.prop(data.profile_image);
    this.sets = m.prop(data.sets || []);
  };

  var Auth = {
    id: null,
    token: null,
    cache: null,
    request: function(options) {
      options.url = 'https://api.quizlet.com/2.0/' + options.url + '?access_token=' + Auth.token;
      options.dataType = 'jsonp';
      return m.request(options)
    },
    getUser: function() {
      if (Auth.cache.free()) {
        return m.deferred().resolve(Auth.cache).promise
      }
      return Auth.request({
        url: 'users/' + Auth.id,
        background: true,
        initialValue: Auth.cache,
        type: User
      }).then(function(user) {
        return Auth.cache = user;
      });
    },
    logIn: function(id, token) {
      Auth.id = id;
      Auth.token = token;
      Auth.cache = new User({
        username: id
      });
      return localforage.setItem('id', id).then(function() {
        return localforage.setItem('token', token);
      });
    },
    loggedIn: function() {
      return (Auth.id && Auth.token);
    },
    init: function() {
      return localforage.getItem('id').then(function(id) {
        Auth.id = id;
        return localforage.getItem('token').then(function(token) {
          Auth.token = token;
          Auth.cache = new User({username: id});
        });
      })
    }
  };

  var Home = {
    controller: function() {
      if (Auth.loggedIn()) {
        m.route('/dashboard');
      }
      return {};
    },
    view: function(controller) {
      return [m('.title', 'QuizPop'), m('a', {href: '/login', config: m.route}, 'Login')];
    }
  };

  var Sets = {
    cache: {},
    getSet: function(id) {
      if (Sets.cache[id] && Sets.cache[id].title()) {
        return m.deferred().resolve(Sets.cache[id]).promise
      }
      return Auth.request({
        url: 'sets/' + id,
        background: true,
        initialValue: Sets.cache[id] || new Set({}),
        type: Set
      }).then(function(set) {
        return Sets.cache[id] = set;
      });
    }
  }

  var Set = function(data) {
    this.title = m.prop(data.title);
  }

  var SetView = {
    controller: function() {
      var set = Sets.getSet(m.route.param('setID'));
      set.then(m.redraw);
      return {
        set: set
      };
    },
    view: function(controller) {
      return m('.title', controller.set().title());
    }
  }

  var Login = {
    view: function(controller) {
      return m('a', {href: '/auth'}, 'Authorize with Quizlet');
    }
  };

  var Dashboard = {
    controller: function() {
      if (m.route.param('token')) {
        Auth.logIn(m.route.param('userID'), m.route.param('token'));
        m.route('/dashboard');
      }
      if (!Auth.loggedIn()) {
        m.route('/login');
      }
      var user = Auth.getUser();
      user.then(m.redraw);
      return {
        user: user
      };
    },
    view: function(controller) {
      return [
        m('.profile', [
          m('.username', controller.user().username()),
          m('img.photo', {src: controller.user().photo()})
          ]),
        m('.sets', controller.user().sets().map(function (set) {
          return m('.set', 
            m('a', {href: '/set/' + set.id, config: m.route}, set.title)
            );
        }))
        ];
    }
  };

  var boot = function() {
    m.route.mode = 'pathname';
    m.route(document.querySelector('#app'), '/', {
      '/': Home,
      '/login': Login,
      '/dashboard': Dashboard,
      '/set/:setID': SetView
    });
  }

  window.QuizPop = function() {
    Auth.init().then(boot);
  };

})(window, m, localforage);