var m = require('mithril');
var localforage = require('localforage')

  var User = function(data) {
    this.username = data.username;
    this.free = data.account_type;
    this.photo = data.profile_image;
    this.sets = data.sets || [];
  };

  var Auth = {
    id: null,
    token: null,
    request: function(options) {
      options.url = 'https://api.quizlet.com/2.0/' + options.url + '?access_token=' + Auth.token;
      return m.jsonp(options);
    },
    logIn: function(id, token) {
      Auth.id = id;
      Auth.token = token;
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
        });
      })
    }
  };

  var Home = {
    oninit: function(vnode) {
      if (Auth.loggedIn()) {
        m.route.setPath("/dashboard");
      }
    },
    view: function(vnode) {
      return [m('.title', 'QuizPop'), m('a', {href: '/login', oncreate: m.route.link}, 'Login')];
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
    this.title = data.title;
  }

  var SetView = {
    oninit: function(vnode) {
      vnode.state.set = new Set({});
      Auth.request({url: 'sets/' + vnode.attrs.setID}).then(function(s){
        vnode.state.set = new Set(s);
      }).then(m.redraw);
    },
    view: function(vnode) {
      return m('.title', vnode.state.set.title);
    }
  }

  var Login = {
    view: function(vnode) {
      return m('a', {href: '/auth'}, 'Authorize with Quizlet');
    }
  };

  var Dashboard = {
    oninit: function(vnode) {
      if (vnode.attrs.token) {
        Auth.logIn(vnode.attrs.userID, vnode.attrs.token);
        m.route.setPath("/dashboard");
      }
      if (!Auth.loggedIn()) {
        m.route.setPath("/login");
      }
      vnode.state.user = new User({});
      Auth.request({url: 'users/' + Auth.id}).then(function(u){
        vnode.state.user = new User(u);
      }).then(m.redraw);
    },
    view: function(vnode) {
      return [
        m('.profile', [
          m('.username', vnode.state.user.username),
          m('img.photo', {src: vnode.state.user.photo})
          ]),
        m('.sets', vnode.state.user.sets.map(function (set) {
          return m('.set', 
            m('a', {href: '/set/' + set.id, oncreate: m.route.link}, set.title)
            );
        }))
        ];
    }
  };

  var boot = function() {
    m.route.prefix('');
    m.route(document.querySelector('#app'), '/', {
      '/': Home,
      '/login': Login,
      '/dashboard': Dashboard,
      '/set/:setID': SetView
    });
  }

  QuizPop = function() {
    Auth.init().then(boot);
  };

module.exports = QuizPop;