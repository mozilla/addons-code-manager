// This is needed because TS doesn't like the following import statement
import worker from 'workerize-loader!./worker'; // eslint-disable-line import/no-webpack-loader-syntax

export default worker;
