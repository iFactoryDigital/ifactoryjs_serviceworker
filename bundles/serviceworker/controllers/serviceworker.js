// Require local class dependencies
const Controller = require('controller');

/**
 * Create Serviceworker Controller
 *
 * @mount /
 */
class ServiceworkerController extends Controller {
  /**
   * Construct Admin Controller class
   */
  constructor() {
    // Run super
    super();

    // Bind public methods
    this.indexAction = this.indexAction.bind(this);
  }

  /**
   * Admin index action
   *
   * @param    {Request}  req Express request
   * @param    {Response} res Express response
   *
   * @view     offline
   * @route    {get} /offline
   * @layout   main
   * @priority 100
   */
  async indexAction(req, res) {
    // render offline page
    res.render();
  }
}

/**
 * Exports Admin Controller class
 *
 * @type {ServiceworkerController}
 */
module.exports = ServiceworkerController;
