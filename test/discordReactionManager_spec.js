const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');
require('should-sinon');

const discordReactionManager = require('../discord/discordReactionManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');

helper.init(require.resolve('node-red'));

describe('discordReactionManager Node', function () {
  let getBotStub;
  let bot;
  let collector;
  let messageObject;
  let channelInstance;

  const flow = [
    { id: 'n1', type: 'discordReactionManager', name: 'reactions', token: 't1', wires: [['n2']] },
    { id: 't1', type: 'discord-token', name: 'token' },
    { id: 'n2', type: 'helper' },
  ];

  beforeEach(function () {
    collector = {
      on: sinon.stub(),
      stop: sinon.stub(),
    };
    messageObject = {
      createReactionCollector: sinon.stub().returns(collector),
    };
    channelInstance = {
      messages: { fetch: sinon.stub().resolves(messageObject) },
    };
    bot = {
      channels: { fetch: sinon.stub().resolves(channelInstance) },
    };
    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves(bot);
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('stops listening when msg.stop is true for a tracked message', function (done) {
    helper.load([discordToken, discordReactionManager], flow, function () {
      const node = helper.getNode('n1');

      // First: start a collector for message 'msg-123'
      node.receive({ channel: 'chan-1', message: 'msg-123' });

      setImmediate(function () {
        // Verify collector was created
        messageObject.createReactionCollector.should.be.calledOnce();

        // Now send stop for that message
        node.receive({ stop: true, message: 'msg-123' });

        setImmediate(function () {
          try {
            collector.stop.should.be.calledOnce();
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });

  it('does nothing when msg.stop is true for an unknown message', function (done) {
    helper.load([discordToken, discordReactionManager], flow, function () {
      const node = helper.getNode('n1');

      node.receive({ stop: true, message: 'unknown-msg' });

      setImmediate(function () {
        try {
          collector.stop.should.not.be.called();
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('creates a collector when msg.stop is not set', function (done) {
    helper.load([discordToken, discordReactionManager], flow, function () {
      const node = helper.getNode('n1');

      node.receive({ channel: 'chan-1', message: 'msg-456' });

      setImmediate(function () {
        try {
          messageObject.createReactionCollector.should.be.calledOnce();
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
