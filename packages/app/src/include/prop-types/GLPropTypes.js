import PropTypes from 'prop-types';

const Container = PropTypes.shape({
  on: PropTypes.func,
  off: PropTypes.func,
  isHidden: PropTypes.bool,
  tab: PropTypes.shape({
    header: PropTypes.shape({
      tabs: PropTypes.arrayOf(
        PropTypes.shape({
          contentItem: PropTypes.shape({}),
        })
      ),
    }),
  }),
  title: PropTypes.string,
  setTitle: PropTypes.func,
  close: PropTypes.func,
});

const EventHub = PropTypes.shape({
  on: PropTypes.func,
  off: PropTypes.func,
  emit: PropTypes.func,
});

const GLPropTypes = Object.freeze({ Container, EventHub });

export default GLPropTypes;
