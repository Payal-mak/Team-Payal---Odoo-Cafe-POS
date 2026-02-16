import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Users,
    X,
    Phone,
    Mail,
    MapPin,
    DollarSign
} from 'lucide-react';
import './CustomersPage.css';

const CustomersPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Fetch customers
    const { data: customersData, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await api.get('/customers');
            return response.data.data;
        }
    });

    // Filter customers by search
    const filteredCustomers = customersData?.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowModal(true);
    };

    const handleDelete = async (customerId) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            await api.delete(`/customers/${customerId}`);
            toast.success('Customer deleted successfully');
            queryClient.invalidateQueries(['customers']);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    return (
        <Layout>
            <div className="customers-page">
                <div className="page-header">
                    <div>
                        <h1>Customer Management</h1>
                        <p>Manage your customer database</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingCustomer(null);
                            setShowModal(true);
                        }}
                    >
                        <Plus size={18} />
                        New Customer
                    </button>
                </div>

                {/* Search */}
                <div className="search-section">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Customers Table */}
                {isLoading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Loading customers...</p>
                    </div>
                ) : filteredCustomers && filteredCustomers.length > 0 ? (
                    <div className="card">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Location</th>
                                    <th>Total Sales</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="customer-name">
                                                <Users size={18} />
                                                <span>{customer.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                {customer.phone && (
                                                    <div className="contact-item">
                                                        <Phone size={14} />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="contact-item">
                                                        <Mail size={14} />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {customer.city && customer.state ? (
                                                <div className="location-info">
                                                    <MapPin size={14} />
                                                    <span>{customer.city}, {customer.state}</span>
                                                </div>
                                            ) : (
                                                <span className="text-secondary">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="sales-amount">
                                                <DollarSign size={14} />
                                                ₹{Number(customer.total_sales || 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEdit(customer)}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>No customers found</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingCustomer(null);
                                setShowModal(true);
                            }}
                        >
                            <Plus size={18} />
                            Add Your First Customer
                        </button>
                    </div>
                )}

                {/* Customer Modal */}
                {showModal && (
                    <CustomerModal
                        customer={editingCustomer}
                        onClose={() => {
                            setShowModal(false);
                            setEditingCustomer(null);
                        }}
                        onSuccess={() => {
                            queryClient.invalidateQueries(['customers']);
                            setShowModal(false);
                            setEditingCustomer(null);
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        city: customer?.city || '',
        state: customer?.state || '',
        country: customer?.country || '',
        zip_code: customer?.zip_code || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (customer) {
                await api.put(`/customers/${customer.id}`, formData);
                toast.success('Customer updated successfully');
            } else {
                await api.post('/customers', formData);
                toast.success('Customer created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{customer ? 'Edit Customer' : 'New Customer'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                className="form-control"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            className="form-control"
                            rows="2"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>State</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Country</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Zip Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.zip_code}
                                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {customer ? 'Update Customer' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomersPage;
