import { Button, Card, Form, Row, message, Modal, Icon } from 'antd';
import React, { Component } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { connect } from 'dva';
import moment from 'moment';
import styles from './style.less';
import Tables from '@/components/Tables';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';
import SearchForm from './components/SearchForm';

const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

@connect(({ internshipActiveManagement, loading }) => ({
  internshipActiveManagement,
  loading: loading.effects['internshipActiveManagement/fetch'],
  loadingAdd: loading.effects['internshipActiveManagement/add'],
  loadingUpdate: loading.effects['internshipActiveManagement/update'],
  loadingToggle: loading.effects['internshipActiveManagement/toggleStatus'],
  loadingDetail: loading.effects['internshipActiveManagement/getDetail'],
}))
class InternCurrentList extends Component {
  state = {
    formValues: {},
    isSearch: false,
    modalCreateVisible: false,
    modalUpdateVisible: false,
  };

  currentPage = null;

  columns = [
    {
      title: 'Mã thực tập sinh',
      sorter: true,
      align: 'center',
      dataIndex: 'username',
      render: (text, record) => (
        <Button type="link" onClick={() => this.showUpdateForm(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Họ và tên',
      sorter: true,
      align: 'center',
      dataIndex: 'full_name',
    },
    {
      title: 'Giới tính',
      align: 'center',
      dataIndex: 'sex_type',
      // eslint-disable-next-line @typescript-eslint/camelcase
      render: sex_type => <span>{sex_type ? 'Nam' : 'Nữ'}</span>,
    },
    {
      title: 'Email',
      sorter: true,
      dataIndex: 'email',
      align: 'center',
    },
    {
      title: 'Số điện thoại',
      sorter: true,
      dataIndex: 'phoneNumber',
      align: 'center',
    },
    {
      title: 'Vị trí thực tập',
      dataIndex: 'position_apply',
      align: 'center',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      align: 'center',
      render: date => <span>{moment(date).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      align: 'center',
      render: dateEnd => <span>{moment(dateEnd).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Hành động',
      render: record => (
        <>
          <Button
            type="link"
            icon="lock"
            onClick={() => this.showConfirmToggleAccountStatus(record)}
          />
          <Button
            type="link"
            style={{ color: 'red' }}
            icon="delete"
            onClick={() => this.showConfirmDeleteAccount(record)}
          />
        </>
      ),
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/fetch',
    });
  }

  handleListChange = (pagination, filtersArg, sorter) => {
    this.currentPage = { pagination, filtersArg, sorter };
    const { dispatch } = this.props;
    const { formValues } = this.state;
    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };

    if (sorter.field) {
      if (sorter.order === 'ascend') {
        params.sorter = {
          [sorter.field]: 0,
        };
      }
      if (sorter.order === 'descend') {
        params.sorter = {
          [sorter.field]: -1,
        };
      }
    }

    dispatch({
      type: 'internshipActiveManagement/fetch',
      payload: params,
    });
  };

  showConfirmToggleAccountStatus = record => {
    Modal.confirm({
      title: `Bạn có chắc muốn khóa thực tập sinh ${record.username} không?`,
      content: '',
      okText: 'Có',
      cancelText: 'Không',
      onOk: () => {
        this.handleToggle(record);
      },
      onCancel: () => {},
    });
  };

  handleToggle = row => {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/toggleStatus',
      payload: row,
      callback: res => {
        if (res && res.status) {
          message.success('Chuyển đổi trạng thái thành công!');
          if (!this.currentPage) {
            dispatch({
              type: 'internshipActiveManagement/fetch',
            });
          } else {
            const { pagination, filtersArg, sorter } = this.currentPage;
            this.handleListChange(pagination, filtersArg, sorter);
          }
        }
      },
    });
  };

  showConfirmDeleteAccount = record => {
    Modal.confirm({
      title: `Bạn có chắc muốn xóa thực tập sinh ${record.full_name} không?`,
      content: '',
      okText: 'Có',
      cancelText: 'Không',
      onOk: () => {
        this.handleRemoveItem(record.id);
      },
      onCancel: () => {},
    });
  };

  handleRemoveItem = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/remove',
      payload: id,
      callback: res => {
        if (res && res.status) {
          message.success('Xóa thành công');
          if (!this.currentPage) {
            dispatch({
              type: 'internshipActiveManagement/fetch',
            });
          } else {
            const { pagination, filtersArg, sorter } = this.currentPage;
            this.handleListChange(pagination, filtersArg, sorter);
          }
        }
      },
    });
  };

  handleSearch = values => {
    this.setState(
      {
        formValues: values,
        isSearch: true,
      },
      this.search,
    );
  };

  handleFormReset = () => {
    this.setState(
      {
        formValues: {},
      },
      this.search,
    );
  };

  search = () => {
    const { dispatch } = this.props;
    if (!this.currentPage) {
      const search = this.state.formValues;
      const dataValues = {
        search,
      };
      dispatch({
        type: 'internshipActiveManagement/fetch',
        payload: dataValues,
        callback: () => {
          this.setState({
            isSearch: false,
          });
        },
      });
    } else {
      const { pagination, filtersArg, sorter } = this.currentPage;
      pagination.current = 1;
      this.handleListChange(pagination, filtersArg, sorter);
    }
  };

  showCreateForm = () => {
    this.handleModalCreateVisible(true);
  };

  handleModalCreateVisible = value => {
    this.setState({
      modalCreateVisible: value,
    });
  };

  showUpdateForm = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/getDetail',
      payload: id,
    });
    this.handleModalUpdateVisible(true);
  };

  handleModalUpdateVisible = value => {
    this.setState({
      modalUpdateVisible: value,
    });
  };

  handleCreate = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/add',
      payload: fields,
      callback: res => {
        if (res && res.status) {
          this.handleModalCreateVisible(false);
          message.success('Thêm mới thành công');
          if (!this.currentPage) {
            dispatch({
              type: 'internshipActiveManagement/fetch',
            });
          } else {
            const { pagination, filtersArg, sorter } = this.currentPage;
            this.handleListChange(pagination, filtersArg, sorter);
          }
        }
      },
    });
  };

  handleUpdate = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'internshipActiveManagement/update',
      payload: fields,
      callback: res => {
        if (res && res.status) {
          this.handleModalUpdateVisible(false);
          message.success('Cập nhật thành công');
          if (!this.currentPage) {
            dispatch({
              type: 'internshipActiveManagement/fetch',
            });
          } else {
            const { pagination, filtersArg, sorter } = this.currentPage;
            this.handleListChange(pagination, filtersArg, sorter);
          }
        }
      },
    });
  };

  renderCreateComp() {
    return (
      <Row type="flex" justify="space-between">
        <Button type="primary" className={styles.customExportBtn} onClick={this.showCreateForm}>
          <Icon type="plus" />
          Thêm thực tập sinh
        </Button>
      </Row>
    );
  }

  render() {
    const {
      internshipActiveManagement: { data, detail },
      loading,
      loadingAdd,
      loadingUpdate,
      loadingToggle,
      loadingDetail,
    } = this.props;
    const { modalCreateVisible, modalUpdateVisible } = this.state;
    return (
      <PageHeaderWrapper>
        <Card className={styles.card} bordered={false}>
          <SearchForm
            handleSearch={this.handleSearch}
            handleFormReset={this.handleFormReset}
            loading={this.state.isSearch && loading}
          />
        </Card>
        <Card className={styles.card} bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm} style={{ marginBottom: 20 }}>
              {this.renderCreateComp()}
            </div>
            <Tables
              loading={loading || loadingDetail || loadingToggle}
              data={data}
              columns={this.columns}
              onChange={this.handleListChange}
            />
          </div>
        </Card>
        <CreateForm
          handleModalVisible={this.handleModalCreateVisible}
          modalVisible={modalCreateVisible}
          handleAdd={this.handleCreate}
          loading={loadingAdd}
        />
        {!loadingDetail && (
          <UpdateForm
            handleModalVisible={this.handleModalUpdateVisible}
            handleAdd={this.handleUpdate}
            modalVisible={modalUpdateVisible}
            data={detail || {}}
            loading={loadingUpdate}
          />
        )}
      </PageHeaderWrapper>
    );
  }
}

export default Form.create()(InternCurrentList);
