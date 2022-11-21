// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

library QuickSort {

    struct StructSortParams {
        address structAddress;
        uint256 value;
    }


    function sortAsc(uint256[] memory data) internal view returns(uint256[] memory) {
       quickSortAsc(data, int(0), int(data.length - 1));
       return data;
    }
    
    function quickSortAsc(uint256[] memory arr, int left, int right) internal view {
        int i = left;
        int j = right;
        if(i==j) return;
        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] < pivot) i++;
            while (pivot < arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSortAsc(arr, left, j);
        if (i < right)
            quickSortAsc(arr, i, right);
    }

    function sortDesc(uint256[] memory data) internal view returns(uint256[] memory) {
       quickSortDesc(data, int(0), int(data.length - 1));
       return data;
    }
    
    function quickSortDesc(uint256[] memory arr, int left, int right) internal view {
        int i = left;
        int j = right;
        if(i==j) return;
        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] > pivot) i++;
            while (pivot > arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSortDesc(arr, left, j);
        if (i < right)
            quickSortDesc(arr, i, right);
    }

    function sortDescStruct(StructSortParams[] memory dataStruct) internal view returns(StructSortParams[] memory) {
       quickSortDescStruct(dataStruct, int(0), int(dataStruct.length - 1));
       return dataStruct;
    }
    
    function quickSortDescStruct(StructSortParams[] memory arr, int left, int right) internal view {
        int i = left;
        int j = right;
        if(i==j) return;
        uint256 pivot = arr[uint256(left + (right - left) / 2)].value;
        while (i <= j) {
            while (arr[uint256(i)].value > pivot) i++;
            while (pivot > arr[uint256(j)].value) j--;
            if (i <= j) {
                (arr[uint256(i)].value, arr[uint256(j)].value) = (arr[uint256(j)].value, arr[uint256(i)].value);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSortDescStruct(arr, left, j);
        if (i < right)
            quickSortDescStruct(arr, i, right);
    }

}
